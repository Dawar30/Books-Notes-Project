# Node-Js-Work
📚 Book Notes – Full Stack Web App

Book Notes is a personal book management and note-taking web application built with the Node.js + Express + PostgreSQL stack.
It allows users to register, log in, and save notes or reviews about the books they read — all in one clean, organized space.

🚀 Features

🔐 User Authentication (Register/Login/Logout) using Passport.js and bcrypt

📖 Add, Edit, and Delete Notes for your favorite books

🗃️ PostgreSQL Database for storing users and their notes

🎨 EJS Templates for dynamic and responsive UI rendering

💾 Session Handling with express-session

⚙️ Environment Variables via dotenv

🌐 RESTful API structure using Express

🔄 Axios Integration for API requests (optional front-end features)

🧰 Tech Stack
Layer	Technology
Frontend	EJS, HTML5, CSS3, JavaScript
Backend	Node.js, Express.js
Database	PostgreSQL
Authentication	Passport.js (Local Strategy), bcrypt
Environment Management	dotenv
📂 Project Structure
book-notes/
│
├── views/              # EJS templates (frontend pages)
├── public/             # Static assets (CSS, images, JS)
├── routes/             # Express route handlers
├── models/             # Database queries and logic
├── app.js / index.js   # Main server file
├── .env                # Environment variables
├── package.json        # Dependencies and scripts
└── README.md

⚙️ Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/yourusername/book-notes.git
cd book-notes

2️⃣ Install dependencies
npm install

3️⃣ Create .env file

In the project root, create a .env file with the following:

PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/booknotes
SESSION_SECRET=your_secret_key

4️⃣ Set up PostgreSQL

Run the SQL commands to create necessary tables:

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  book_title VARCHAR(255),
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

5️⃣ Start the server
npm start


Server will run at http://localhost:3000

🧩 Future Enhancements

🖼️ Add book cover uploads

⭐ Implement book rating system

🔍 Add search and filtering

🧠 Integrate external book APIs (Google Books API)

📱 Responsive frontend using Bootstrap or Tailwind

👨‍💻 Author

[Dawar Abbas]
Full Stack Developer | Passionate about clean UI and seamless backend integration
📧 meesumabbas891@.com

🪪 License

This project is licensed under the MIT License – feel free to use and modify.

