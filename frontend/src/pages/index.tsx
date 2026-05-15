import React from "react";
import UserInterface from "@/components/UserInterface";

const Home: React.FC = () => {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <UserInterface backendName="Rust" />
      </div>
    </main>
  )
}

export default Home;