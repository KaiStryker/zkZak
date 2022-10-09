import { Button, TextField } from "@mui/material";
import { VerificationResponse, WorldIDWidget } from "@worldcoin/id";
import { useEffect, useState } from "react";
import { QRCode } from "react-qr-svg";
import io from "socket.io-client";

const socket = io("http://localhost:8080");

enum Stage {
  STEP1,
  STEP2,
  STEP3,
  STEP4,
}

const Creator = () => {
  const [step, setStep] = useState<Stage>(Stage.STEP4);
  const [qrCode, setQrCode] = useState();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [proven, setProven] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("proven", (data: any) => {
      if (data.proof) setStep(Stage.STEP4);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("pong");
    };
  }, []);

  const fetchQrCode = () => {
    return new Promise((resolve, reject) => {
      fetch("http://localhost:8080/" + "api/sign-in")
        .then((r) =>
          Promise.all([Promise.resolve(r.headers.get("x-id")), r.json()])
        )
        .then(([id, data]) => {
          console.log(data);
          setQrCode(data);

          resolve(id);
        })
        .catch((err) => reject(err));
    });
  };

  return (
    <div className="flex items-center justify-center flex-col h-screen">
      {step === Stage.STEP1 && (
        <div>
          <h1 className="text-3xl pb-10">
            But first are you even a human, anon?
          </h1>
          <WorldIDWidget
            actionId="wid_staging_dfcc5889882f235f773d0945e069ab96" // obtain this from developer.worldcoin.org
            signal="OnlyOnce"
            enableTelemetry
            onSuccess={async (verificationResponse: VerificationResponse) => {
              setStep(Stage.STEP2);
            }} // you'll actually want to pass the proof to the API or your smart contract
            onError={(error) => console.error(error)}
          />
        </div>
      )}

      {step === Stage.STEP2 && (
        <div>
          <h1 className="text-3xl pb-10">Great, whats your degen skill?</h1>
          <TextField
            fullWidth
            label="skill"
            id="fullWidth"
            sx={{ marginBottom: "25px" }}
          />
          <Button
            variant="contained"
            onClick={() => {
              fetchQrCode().then(() => setStep(Stage.STEP3));
            }}
          >
            I'll prove it to you!
          </Button>
        </div>
      )}

      {step === Stage.STEP3 && (
        <div>
          <h1 className="text-3xl pb-10">Prove it to me!!!!</h1>
          <QRCode
            level="Q"
            style={{ width: 256 }}
            value={JSON.stringify(qrCode)}
          />
        </div>
      )}

      {step === Stage.STEP4 && (
        <div>
          <h1 className="text-3xl pb-10">Finally lets connect your wallet</h1>
          {/* <ConnectButton moralisAuth={false} /> */}
        </div>
      )}
    </div>
  );
};

export default Creator;
