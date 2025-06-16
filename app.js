const express = require("express");
const bodyParser = require("body-parser");
const app = express();

let posts = [];

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home", { posts: posts });
});

app.get("/compose", (req, res) => {
  res.render("compose");
});

app.post("/compose", (req, res) => {
  const post = {
    title: req.body.title,
    content: req.body.content
  };
  posts.push(post);
  res.redirect("/");
});

app.get("/posts/:postIndex", (req, res) => {
  const post = posts[req.params.postIndex];
  res.render("post", { post: post, index: req.params.postIndex });
});

 
app.get("/edit/:postIndex", (req, res) => {
  const post = posts[req.params.postIndex];
  res.render("edit", { post: post, index: req.params.postIndex });
});

 
app.post("/edit/:postIndex", (req, res) => {
  const index = req.params.postIndex;
  posts[index] = {
    title: req.body.title,
    content: req.body.content
  };
  res.redirect("/");
});
 
app.post("/delete/:postIndex", (req, res) => {
  const index = req.params.postIndex;
  posts.splice(index, 1);  
  res.redirect("/");
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});

