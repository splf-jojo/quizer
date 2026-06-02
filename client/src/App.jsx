import { Navigate, Route, Routes } from "react-router-dom";
import AdminCreateTestPage from "./pages/AdminCreateTestPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminProtectedLayout from "./pages/AdminProtectedLayout.jsx";
import AdminRoomPage from "./pages/AdminRoomPage.jsx";
import AdminRoomSetupPage from "./pages/AdminRoomSetupPage.jsx";
import QuizPage from "./pages/QuizPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";
import RoomJoinPage from "./pages/RoomJoinPage.jsx";
import WaitingRoomPage from "./pages/WaitingRoomPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<AdminProtectedLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="create" element={<AdminCreateTestPage />} />
      </Route>
      <Route path="/admin/rooms/new/:quizId" element={<AdminRoomSetupPage />} />
      <Route path="/admin/rooms/:code" element={<AdminRoomPage />} />
      <Route path="/room/:code" element={<RoomJoinPage />} />
      <Route path="/room/:code/waiting" element={<WaitingRoomPage />} />
      <Route path="/room/:code/quiz" element={<QuizPage />} />
      <Route path="/room/:code/result" element={<ResultPage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
