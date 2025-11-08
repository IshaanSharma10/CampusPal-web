#🎓 CampusPal – Your Campus, Connected.

CampusPal is a smart social web platform designed to bring students, faculty, and campus communities together — all in one digital space.
It simplifies communication, event discovery, and academic engagement, turning your campus into a connected ecosystem.

✨ Overview

CampusPal bridges the gap between students, faculty, and administration by providing a unified platform for communication, collaboration, and campus life management.
Whether you’re discussing coursework, joining clubs, or staying updated on campus news — CampusPal makes it effortless.

🚀 Features
🧑‍🎓 For Students

💬 Real-time Chat — Connect with friends, classmates, and communities

🗓️ Event Discovery — Stay updated on fests, workshops, and seminars

📢 Clubs, Polls & Announcements — Participate in student life actively

📚 Academic Updates — Stay on top of notices and study group discussions

🧑‍🏫 For Faculty & Admins

📜 Notice Board Management — Post important academic and campus updates

🏫 Event Creation — Host and manage institutional events seamlessly

🗳️ Polls & Group Management — Create polls and manage student groups

💬 Direct Communication — Interact with students quickly and efficiently

🛠️ Tech Stack
Frontend

⚛️ React + Vite

🎨 Tailwind CSS / MUI Components

🔗 Socket.io (for real-time communication)

Backend

🟢 Node.js + Express

🔥 Firebase (Database + Authentication + Cloud Storage)

💬 Firestore Server (Real-time messaging)



⚙️ Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/<your-username>/CampusPal-web.git
cd CampusPal-web

2️⃣ Install dependencies
npm install

3️⃣ Set up environment variables

Create a .env file in the root directory and add your Firebase + Socket.io configurations:

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_SOCKET_SERVER_URL=your_socket_server_url

4️⃣ Start the development server
npm run dev


The app will be live at:
👉 http://localhost:5173

🌐 Deployment

CampusPal can be easily deployed using:

Frontend: Vercel
 / Netlify

Backend: Render
 / Railway

Firebase: For hosting + database management

📸 Screenshots (Optional)

(Add screenshots or GIFs of your app here to make the README more appealing)
Example:


📅 Future Enhancements

AI-based academic assistant

Peer mentoring & Q&A forums

Event ticketing & attendance tracking

Role-based analytics dashboard

🤝 Contributing

Contributions are welcome!
If you’d like to improve CampusPal:

Fork the repo

Create a feature branch (git checkout -b feature/YourFeature)

Commit your changes

Push the branch and open a pull request

🧑‍💻 Author

Ishaan Sharma
📍 Thapar Institute of Engineering & Technology
