import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt, { hash } from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import env from "dotenv";
import axios from "axios";


const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

let books = []


app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);


//Middleware for communication with ejs files 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());


const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();


app.get("/", async (req, res) => {
    try {
        const result = await db.query(`
  SELECT 
    books.id AS book_id,
    books.title,
    books.author,
    books.cover_url,
    books.rating,
    users.username
  FROM books
  INNER JOIN users ON books.user_id = users.id
`);


        res.render("index.ejs", { books: result.rows });
    } catch (err) {
        console.error("Error fetching books:", err);
        res.send("❌ Failed to load books.");
    }
})

//To display register from
app.get("/register", (req, res) => {
    res.render("register.ejs");
});
//To display login form
app.get("/login", (req, res) => {
    res.render("login.ejs");
})

//To get addBooks form
app.get("/add", (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.redirect("/login");
        }
        res.render("addbooks.ejs");
    } catch (error) {
        console.log(error);
    }
})

//Get route for books
app.get("/books/:id", async (req, res) => {
    const bookID = parseInt(req.params.id);

    // If bookID isn’t a number, don’t even query the DB
    if (isNaN(bookID)) {
        return res.status(400).send("Invalid book ID");
    }

    try {
        const result = await db.query("SELECT * FROM books WHERE id = $1", [bookID]);

        if (result.rows.length === 0) {
            return res.status(404).send("Book not found");
        }

        const book = result.rows[0];
        res.render("books.ejs", { book });
    } catch (err) {
        console.error("Error fetching book:", err);
        res.status(500).send("Internal server error");
    }
});

//Post route for updating books
// Update book details (only if user owns the book)
app.post("/books/:id/update", async (req, res) => {
    const bookID = parseInt(req.params.id);
    const { notes, rating } = req.body;

    try {
        if (!req.isAuthenticated()) {
            return res.redirect("/login");
        }

        // Attempt update
        const result = await db.query(
            "UPDATE books SET notes=$1, rating=$2 WHERE id=$3 AND user_id=$4 RETURNING *",
            [notes, rating, bookID, req.user.id]   // ✅ enforce ownership
        );

        if (result.rowCount === 0) {
            // No rows updated → either book not found or not owned by user
            return res.status(403).send("⛔ You are not allowed to update this book.");
        }

        res.redirect(`/books/${bookID}`);
    } catch (err) {
        console.error("Error updating book:", err);
        res.status(500).send("⚠️ Error updating book");
    }
});


//post route to delete book
app.post("/books/:id/delete", async (req, res) => {
    const bookID = parseInt(req.params.id);

    try {
        if (!req.isAuthenticated()) {
            return res.redirect("/login");
        }

        await db.query(
            "DELETE FROM books WHERE id=$1",
            [bookID]   // ✅ use req.user.id instead
        );

        res.redirect("/");
    } catch (err) {
        console.error("Error deleting book:", err);
        res.status(500).send("Error deleting book");
    }

})
//Post route for adding the books
app.post("/add", async (req, res) => {
    const title = req.body.title;
    const author = req.body.author;
    const cover_url = req.body.cover_url;
    try {
        await db.query(
            "INSERT INTO books (title, author, cover_url,user_id) VALUES ($1, $2, $3, $4)",
            [title, author, cover_url, req.user.id]
        );

        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.send("Error fetching book details");
    }
})
//Search route
app.post("/search-book", async (req, res) => {
    const title = req.body.title;

    try {
        const response = await axios.get(
            `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`
        );

        const books = response.data.docs.slice(0, 10); // get top 10 results
        res.render("searchResults.ejs", { books });
    } catch (err) {
        console.error(err);
        res.send("Error fetching book details");
    }
});

//Post route for login page
app.post('/login',
    passport.authenticate('local', {
        successRedirect: "/",
        failureRedirect: "login"
    }));

//Now post route for registring user
app.post("/register", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;

    try {
        const queryResult = await db.query("SELECT * FROM users WHERE email = $1",
            [email]
        );
        if (queryResult.rows.length > 0) {
            res.redirect("/login");
        } else {
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err) {
                    console.log("Error in hashing input password", err);
                } else {
                    const resultQuery = await db.query("INSERT INTO users (username, email, password) VALUES ($1,$2,$3) RETURNING *",
                        [username, email, hash]
                    );
                    const user = resultQuery.rows[0];
                    req.login(user, (err) => {
                        console.log("Success");
                        res.redirect("/");
                    })
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
});


app.get("/logout", (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).send("Failed to log out.");
            }
            res.clearCookie("connect.sid"); // clear cookie
            res.redirect("/login"); // go back to login page
        });
    } else {
        res.redirect("/login");
    }
});



passport.use(new Strategy(
    async function (username, password, cb) {
        try {
            const result = await db.query("SELECT * FROM users WHERE username = $1",
                [username]
            );
            if (result.rows.length > 0) {
                const user = result.rows[0];
                const storedHashedPassword = user.password;
                bcrypt.compare(password, storedHashedPassword, (err, valid) => {
                    if (err) {
                        console.log("Error in password comparison: ", err);
                        return cb(err);
                    } else {
                        if (valid) {
                            return cb(null, user);
                        } else {
                            return cb(null, false);
                        }
                    }
                });
            } else {
                return cb("User not found");
            }
        } catch (error) {
            console.log(error);
        }
    }
));

passport.serializeUser((user, cb) => {
    cb(null, user);
});
passport.deserializeUser((user, cb) => {
    cb(null, user);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})



