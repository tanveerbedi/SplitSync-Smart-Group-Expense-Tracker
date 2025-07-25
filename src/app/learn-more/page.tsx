
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SplitIcon, Users, PieChart, Star, Bot, FileText, ArrowLeft, CheckCircle, Mail, Linkedin, Github } from 'lucide-react';
import { SplitSyncLogo } from '@/components/icons';

const features = [
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: 'Seamless Group Management',
    description: 'Effortlessly create groups for any occasion, invite members with a simple link or email, and keep everyone in the loop. Perfect for trips, roommates, projects, and more.',
  },
  {
    icon: <SplitIcon className="h-6 w-6 text-primary" />,
    title: 'Flexible & Powerful Splitting',
    description: 'Go beyond 50/50. Split expenses by exact amounts, percentages, or shares. SplitSync handles the complex math, so you don’t have to.',
  },
  {
    icon: <Bot className="h-6 w-6 text-primary" />,
    title: 'AI-Powered Category Suggestions',
    description: 'Forget manual entry. Our smart AI analyzes your expense descriptions and suggests the most relevant category, saving you time and effort.',
  },
  {
    icon: <PieChart className="h-6 w-6 text-primary" />,
    title: 'Insightful Analytics & Trends',
    description: 'Visualize your spending with beautiful charts and graphs. Understand where your money is going and identify trends to budget smarter.',
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-primary" />,
    title: 'Simplified Settle-Up',
    description: 'Our smart algorithm calculates the simplest way for everyone to get paid back. Settle debts with a few clicks and keep relationships happy.',
  },
  {
    icon: <Star className="h-6 w-6 text-primary" />,
    title: 'Fun & Engaging Gamification',
    description: 'Earn badges and achievements for being a responsible and active member. A little friendly competition makes managing money more enjoyable.',
  },
  {
    icon: <FileText className="h-6 w-6 text-primary" />,
    title: 'Easy Data Export',
    description: 'Need your data for taxes or personal records? Export your group expenses to a clean, organized CSV file anytime.',
  },
];

export default function LearnMorePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <SplitSyncLogo className="h-8 w-8 text-primary" />
          <span className="ml-3 text-2xl font-bold font-headline">SplitSync</span>
        </Link>
        <div className="ml-auto">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Dive Deeper into SplitSync</h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-balance">
                  Discover the powerful features that make SplitSync the ultimate tool for managing shared expenses with ease and transparency.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-stretch gap-8 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                        {feature.icon}
                        <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50 border-t">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">Ready to Get Started?</h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-balance">
                Join thousands of users who are simplifying their shared finances. Sign up for free and experience the future of expense splitting.
              </p>
            </div>
            <div className="mx-auto mt-6">
              <Link href="/login" prefetch={false}>
                <Button size="lg" className="shadow-lg hover:scale-105 transition-transform">
                  Sign Up for Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container flex flex-col items-center justify-center gap-6 py-8 px-4 md:px-6">
            <div className="flex items-center gap-2">
                <SplitSyncLogo className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">&copy; 2025 SplitSync. All rights reserved.</p>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Created by Tanveer Singh Bedi</p>
              <div className="flex items-center justify-center gap-4 mt-2">
                <a href="mailto:tsbedi2604@gmail.com" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Mail className="h-4 w-4" />
                  Email
                </a>
                <a href="https://www.linkedin.com/in/tanveer-singh-bedi-a8b811177/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
                 <a href="https://github.com/tanveerbedi" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
