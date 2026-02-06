import React from "react";
import ImageManager from "../../components/images/ImageManager";
import { Header } from "@/components/Header";
import { useCurrentUser } from "@/hooks/use-currentuser";

const MainPage = () => {
  const { data: currentUser } = useCurrentUser();

  return (
    <div className=" w-full h-screen flex flex-col overflow-hidden">
      <Header title="Images Manager" />
      <ImageManager currentUser={currentUser} />
    </div>
  );
};

export default MainPage;
