import { LoginForm } from './_components/LoginForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="pt-40 pb-4">
        <h1
          className="text-4xl font-bold text-center text-[#4A0ED5] drop-shadow mb-4"
          style={{ fontFamily: '"Pacifico", "Caveat", "Dancing Script", cursive' }}
        >
          Welcome to TEAMVOICE
        </h1>
      </div>
      <div className="mx-auto flex min-h-screen max-w-6xl items-start justify-center px-6 py-4">
        <div className="flex w-full items-stretch justify-between gap-10 bg-[var(--background)]">
          <div className="w-full max-w-md self-stretch flex-1">
            <div className="bg-[#4A0ED5] text-white rounded-lg shadow-xl p-8 h-[620px]">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white">Employee Pulse</h1>
                <p className="text-white mt-2">
                  Democratizing Employee Listening & Engagement
                </p>
              </div>

              <div className="space-y-6">
                <LoginForm variant="google" />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#4A0ED5] text-white">Or continue with email</span>
                  </div>
                </div>

                <LoginForm variant="email" />
              </div>

            </div>
          </div>

          <div className="flex-[3] self-stretch flex items-center justify-center">
            <div className="relative h-[620px] w-full overflow-hidden rounded-3xl bg-[var(--background)]">
              <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-indigo-100" />
              <img
                className="relative h-full w-full object-contain shadow-2xl"
                src="/hand.png"
                alt="Hero hand visual"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
