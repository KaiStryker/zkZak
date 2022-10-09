import { VerificationResponse, WorldIDWidget } from "@worldcoin/id";
import { useEffect, useState } from "react";
import { QRCode } from "react-qr-svg";

const Creator = () => {
  const [isHuman, setIsHuman] = useState<boolean>(true);
  const [qrCode, setQrCode] = useState();
  const [hasCredentials, setHasCredentials] = useState<boolean>(false);

  useEffect(() => {
    fetch("http://localhost:8080/" + "api/sign-in")
      .then((r) =>
        Promise.all([Promise.resolve(r.headers.get("x-id")), r.json()])
      )
      .then(([id, data]) => {
        console.log(data);
        setQrCode(data);
        return id;
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="flex items-center justify-center flex-col h-screen gap-10">
      <h1 className="text-3xl">Are you even a human, anon?</h1>
      <div>
        {!isHuman && (
          <WorldIDWidget
            actionId="wid_staging_dfcc5889882f235f773d0945e069ab96" // obtain this from developer.worldcoin.org
            signal="OnlyOnce"
            enableTelemetry
            onSuccess={async (verificationResponse: VerificationResponse) => {
              setIsHuman(true);
            }} // you'll actually want to pass the proof to the API or your smart contract
            onError={(error) => console.error(error)}
          />
        )}

        {isHuman && !hasCredentials && (
          <QRCode
            level="Q"
            style={{ width: 256 }}
            value={JSON.stringify(qrCode)}
          />
        )}
      </div>
    </div>
  );
};

export default Creator;
