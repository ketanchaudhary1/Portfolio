"use client";

import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const askQuestion = async (questionText?: string) => {
    const questionToAsk = questionText ?? question;

    if (!questionToAsk.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: questionToAsk,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: questionToAsk,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't connect to the backend. Please make sure FastAPI is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askQuestion();
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4">

        {/* Header */}
        <header className="border-b border-zinc-800 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                Ask Ketan AI
              </h1>

              <p className="text-sm text-zinc-500">
                AI assistant powered by my resume
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm text-zinc-400">
                Online
              </span>
            </div>
          </div>
        </header>

        {/* Chat */}
        <section className="flex-1 overflow-y-auto py-8">

          {messages.length === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">

              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl text-black">
                K
              </div>

              <h2 className="text-3xl font-semibold">
                Ask me anything about Ketan
              </h2>

              <p className="mt-3 max-w-lg text-zinc-500">
                I can answer questions about experience, skills,
                projects, education and certifications using
                information from Ketan&apos;s resume.
              </p>

              {/* Suggestions */}
              <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">

                <Suggestion
                  text="Tell me about Ketan's experience"
                  onClick={() =>
                    askQuestion("Tell me about Ketan's experience")
                  }
                />

                <Suggestion
                  text="What are Ketan's technical skills?"
                  onClick={() =>
                    askQuestion(
                      "What are Ketan's technical skills?"
                    )
                  }
                />

                <Suggestion
                  text="Tell me about Ketan's projects"
                  onClick={() =>
                    askQuestion(
                      "Tell me about Ketan's projects"
                    )
                  }
                />

                <Suggestion
                  text="What is Ketan's education?"
                  onClick={() =>
                    askQuestion(
                      "What is Ketan's education?"
                    )
                  }
                />

              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-5 py-3 ${
                      message.role === "user"
                        ? "bg-white text-black"
                        : "bg-zinc-900 text-zinc-200"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-zinc-900 px-5 py-3 text-zinc-500">
                    Thinking...
                  </div>
                </div>
              )}

            </div>
          )}
        </section>

        {/* Input */}
        <div className="sticky bottom-0 pb-5 pt-3">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-2"
          >
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  handleSubmit(
                    e as unknown as React.FormEvent
                  );
                }
              }}
              placeholder="Ask something about Ketan..."
              rows={1}
              className="max-h-32 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
            />

            <button
              type="submit"
              disabled={!question.trim() || loading}
              className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "..." : "Send"}
            </button>
          </form>

          <p className="mt-2 text-center text-xs text-zinc-700">
            AI responses are generated from resume information.
          </p>
        </div>

      </div>
    </main>
  );
}

function Suggestion({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left text-sm text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
    >
      {text}
    </button>
  );
}