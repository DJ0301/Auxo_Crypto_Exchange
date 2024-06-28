// src/BackgroundVideo.js

import React from "react";

const BackgroundVideo = () => {
  return (
    <video
      autoPlay
      loop
      muted
      style={{
        position: "fixed",
        width: "100vw",
        height: "100vh",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        objectFit: "cover",
        zIndex: "-1",
        
      }}
    >
      <source src={`${process.env.PUBLIC_URL}/background.mp4`} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
};

export default BackgroundVideo;
