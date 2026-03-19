import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-background to-blue-50/50 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            <Image
              src="/scholar-favicon-full.png"
              alt="IO Scholar"
              width={72}
              height={72}
              className="rounded-2xl shadow-lg"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            IO Assistant
          </CardTitle>
          <CardDescription className="text-base">
            Admin Management for IO Scholar
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-2 pb-8">
          <Button asChild size="lg" className="gap-2 px-8">
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
