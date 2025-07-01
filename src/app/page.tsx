"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, User, Lock, ChevronRight, Loader2 } from "lucide-react";

type LoginForm = {
  username: string;
  password: string;
};

const LoginForm = () => {
  const [formData, setFormData] = useState<LoginForm>({
    username: "",
    password: "",
  });
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      return;
    }

    await login(formData.username, formData.password);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden">
        <CardContent className="flex justify-center p-8">
          <div className="w-full max-w-md space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="size-12 bg-primary rounded-full flex items-center justify-center mb-2">
                <User className="size-6 text-background" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight">
                Welcome back
              </h1>

              <p className="text-muted-foreground text-balance">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    required
                    type="text"
                    id="username"
                    name="username"
                    className="pl-10"
                    autoComplete="off"
                    disabled={isLoading}
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    required
                    id="password"
                    name="password"
                    autoComplete="off"
                    disabled={isLoading}
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full text-background"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Home = () => {
  return (
    <div className="bg-background flex min-h-[82vh] flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-lg">
        <LoginForm />
      </div>
    </div>
  );
};

export default Home;
