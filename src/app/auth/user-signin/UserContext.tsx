// // context/UserContext.tsx
// "use client";

// import React, { createContext, useContext, useEffect, useState } from "react";

// interface User {
//   user_id: number;
//   name: string;
// }

// const defaultUser: User = {
//   user_id: 1,
//   name: "테스트유저",
// };

// const UserContext = createContext<User | null>(null);

// export const UserProvider = ({ children }: { children: React.ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);

//   useEffect(() => {
//     const saved = localStorage.getItem("test_user");
//     if (saved) {
//       setUser(JSON.parse(saved));
//     } else {
//       localStorage.setItem("test_user", JSON.stringify(defaultUser));
//       setUser(defaultUser);
//     }
//   }, []);

//   if (!user) return null;

//   return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
// };

// export const useUser = () => {
//   const user = useContext(UserContext);
//   if (!user) throw new Error("UserContext not available");
//   return user;
// };
