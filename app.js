//jshint esversion:6

/// Imports
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

/// App
const app = express();

/// Settings
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

/// Database
mongoose.connect("mongodb+srv://admin-eligio:l0k1n3t0@cluster0.0c3lz.mongodb.net/todoListDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: true,
});

/// Schema
const itemSchema = {
  name: {
    type: String,
    required: [true, "Item name needed"],
  },
};

// Model
const Item = mongoose.model("Item", itemSchema);

const items = [
  new Item({ name: "Install Gentoo" }),
  new Item({ name: "Install Arch" }),
  new Item({ name: "Reinstall Gentoo" }),
];

const listSchema = {
  name: {
    type: String,
    required: [true, "List needs name"],
  },
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

//Item.insertMany(items);

/// Index GET
app.get("/", (req, res) => {
  Item.find({}, (err, results) => {
    if (results.length === 0) {
      Item.insertMany(items, (err) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/");
        }
      });
    } else {
      res.render("list", { listTitle: "Today", items: results });
    }
  });
});

/// Index POST
app.post("/", (req, res) => {
  console.log(req.body);
  if (req.body.list === "Today") {
    item = new Item({ name: req.body.newItem });
    item.save();
    res.redirect("/");
  } else {
    const list = req.body.list;
    const item = new Item({ name: req.body.newItem });
    List.findOne({ name: list }, (err, result) => {
      if (!err) {
        if (!result) {
          console.log("No list");
        } else {
          result.items.push(item);
          result.save();
          res.redirect("/" + list);
        }
      } else {
        console.log(err);
      }
    });
  }
});

/// Delete
app.post("/delete", (req, res) => {
  const itemId = req.body.checkbox;
  const l = req.body.list;
  if (l === "Today") {
    Item.deleteOne({ _id: req.body.checkbox }, (err) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: l },
      { $pull: { items: { _id: itemId } } },
      (err, result) => {
        if (!err) {
          res.redirect("/" + l);
        }
      }
    );
  }
});

/// Custom list
app.get("/:listName", (req, res) => {
  const lname = _.capitalize(req.params.listName);
  List.findOne({ name: lname }, (err, results) => {
    if (err) {
      console.log(err);
    }
    if (!results) {
      l = new List({
        name: lname,
        items: [new Item({ name: "Your " + lname + " list" })],
      });
      l.save();
      res.redirect("/" + lname);
    } else {
      res.render("list", {
        listTitle: results.name,
        items: results.items,
      });
    }
  });
});

/// About get
app.get("/about", (req, res) => {
  res.render("about");
});

/// Run the app
app.listen(3000, () => {
  console.log("server started on http://0.0.0.0:3000");
});