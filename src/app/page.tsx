"use client";

import Link from "next/link";

export default function Welcome() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: "url('/osakedata.jpeg')",
      }}
    >
      <div className="w-full max-w-md bg-card-gray/90 p-8 rounded-custom shadow-custom backdrop-blur-md">
        <h1 className="text-3xl text-center mb-8">
          Tervetuloa Osakedata-palveluun
        </h1>

        <div className="flex flex-col gap-4">
          <Link
            href="/register"
            className="bg-btn-blue text-white text-center py-3 rounded-custom shadow-custom hover:opacity-90 transition-opacity"
          >
            Rekisteröidy
          </Link>

          <Link
            href="/login"
            className="bg-white border-2 border-btn-blue text-btn-blue text-center py-3 rounded-custom shadow-custom hover:opacity-90 transition-opacity"
          >
            Kirjaudu sisään
          </Link>
        </div>
      </div>
    </div>
  );
}
