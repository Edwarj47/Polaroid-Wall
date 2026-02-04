import { redirect } from "next/navigation";

export default function AlbumsRedirect() {
  redirect("/collections");
}
