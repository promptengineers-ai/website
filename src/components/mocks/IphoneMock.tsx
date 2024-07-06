
const IphoneMock: React.FC = () => {
    return (
      <div
        className="relative mx-auto"
        style={{
          width: "350px",
          height: "690px",
          backgroundImage:
            'url("https://agent.commit.dev/iphone-11.1ef522d0.png")',
          backgroundPosition: "center",
          backgroundSize: "350px 690px",
          backgroundRepeat: "no-repeat",
        }}
      >
        <video
          className="absolute"
          src="https://agent.commit.dev/landing-page-video.352a9d12.mp4#t=0.1"
          loop
          playsInline
          preload="auto"
          autoPlay
          muted
          style={{
            left: "26px",
            top: "23px",
            width: "298px",
            height: "643px",
            borderRadius: "40px",
            objectFit: "fill",
          }}
        ></video>
      </div>
    );
}

export default IphoneMock