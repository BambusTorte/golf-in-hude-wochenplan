import { redirect } from "next/navigation";

// Die Übersicht ist jetzt die Startseite; alte /plan-Links leiten dorthin.
export default function PlanListRedirect() {
  redirect("/");
}
