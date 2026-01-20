"use client";

import { Button, Input, Text } from "@restorio/ui";
import { useState, type ReactElement } from "react";

export const RegisterContent = (): ReactElement => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Register:", { email, password });
  };

  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <div className="mb-8">
          <Text variant="h1" className="mb-2 text-3xl font-bold">
            Create an account
          </Text>
          <Text variant="body-md" className="text-text-secondary">
            Get started with Restorio today.
          </Text>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" size="lg" fullWidth>
            Register
          </Button>
        </form>
      </div>
    </div>
  );
};
