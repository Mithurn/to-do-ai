"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CalendarRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/to-dos/calendar/daily");
  }, [router]);
  return null;
} 