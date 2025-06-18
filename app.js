const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const session = require("express-session");

const app = express();
let posts = [];
let users = [];

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Session setup
app.use(session({
  secret: "blog-secret",
  resave: false,
  saveUninitialized: false
}));

// ✅ Middleware to make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Middleware for auth check
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

// Routes
app.get("/", (req, res) => {
  res.render("home", { posts: posts }); // user is already available in res.locals
});

app.get("/compose", isAuthenticated, (req, res) => {
  res.render("compose");
});

app.post("/compose", isAuthenticated, upload.single("image"), (req, res) => {
  const post = {
    title: req.body.title,
    content: req.body.content,
    imagePath: req.file ? "/uploads/" + req.file.filename : null
  };
  posts.push(post);
  res.redirect("/");
});

app.get("/posts/:postIndex", (req, res) => {
  const post = posts[req.params.postIndex];
  res.render("post", { post: post, index: req.params.postIndex });
});

app.get("/edit/:postIndex", isAuthenticated, (req, res) => {
  const post = posts[req.params.postIndex];
  res.render("edit", { post: post, index: req.params.postIndex });
});

app.post("/edit/:postIndex", isAuthenticated, upload.single("image"), (req, res) => {
  const index = req.params.postIndex;
  posts[index].title = req.body.title;
  posts[index].content = req.body.content;
  if (req.file) {
    posts[index].imagePath = "/uploads/" + req.file.filename;
  }
  res.redirect("/");
});

app.post("/delete/:postIndex", isAuthenticated, (req, res) => {
  posts.splice(req.params.postIndex, 1);
  res.redirect("/");
});

// Login/Register
app.get("/login", (req, res) => res.render("login"));

app.post("/login", (req, res) => {
  const user = users.find(u => u.username === req.body.username && u.password === req.body.password);
  if (!user) return res.send("Invalid credentials. <a href='/login'>Try again</a>");
  req.session.user = user;
  res.redirect("/");
});

app.get("/register", (req, res) => res.render("register"));

app.post("/register", (req, res) => {
  const existingUser = users.find(u => u.username === req.body.username);
  if (existingUser) return res.send("Username exists. <a href='/register'>Try again</a>");
  const newUser = { username: req.body.username, password: req.body.password };
  users.push(newUser);
  req.session.user = newUser;
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

app.get("/all-posts", (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase() : "";
  const page = parseInt(req.query.page) || 1;
  const perPage = 5;

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(query) ||
    post.content.toLowerCase().includes(query)
  );

  const paginatedPosts = filteredPosts.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filteredPosts.length / perPage);

  res.render("all-posts", {
    posts: paginatedPosts,
    currentPage: page,
    totalPages,
    query: req.query.q || ""
  });
});

// Start server
app.listen(3000, () => {
  console.log("Server started on port 3000");
});

