import React from "react";
import footerStyles from "../styles/Footer.module.css";
import Partners from "./Partners.component";

export default function Footer() {
  return (
    <div className={footerStyles.container}>
      <Partners />
            <span> En cas de problème, contactez-nous à l'adresse : investdays@garageisep.com
</span>
      <span>
        Rejoindre{" "}
        <a
          href="https://discord.gg/hstvfHKP"
          target="_blank"
          rel="noreferrer"
        >
          notre discord
        </a>{" "}
      </span>
      <span>Invest Days - v2.0</span>

    </div>
  );
}