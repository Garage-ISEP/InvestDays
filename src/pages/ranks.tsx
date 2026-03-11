import Head from "next/head";
import homeStyles from "../styles/Home.module.css";
import TableRanks from "../components/TableRanks.component.jsx";
import DashBoardLayout from "../components/layouts/DashBoard.layout";
import { useEffect, useState, useMemo } from "react";
import { useFetch } from "../context/FetchContext";
import { useWallet } from "../context/WalletContext";
import { useAuthentification } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function Ranks() {
  const [dataRanks, setDataRanks] = useState<any[]>([]);
  const { selectedId } = useWallet();
  const { user } = useAuthentification();
  const { lang } = useLanguage();
  const fetch = useFetch();

  const translations = {
    fr: {
      headTitle: "InvestDays - Classement Global",
      title: "Classement Global",
      sub: "Basé sur la valeur totale du portefeuille",
      perfTitle: "Ta Performance",
      rankLabel: "Classement #",
      cashLabel: "VALEUR TOTALE",
      profitLabel: "PROFIT/PERTE",
      topTraders: "Top Investisseurs",
    },
    en: {
      headTitle: "InvestDays - Global Ranking",
      title: "Global Ranking",
      sub: "Based on total portfolio value",
      perfTitle: "Your Performance",
      rankLabel: "Rank #",
      cashLabel: "TOTAL VALUE",
      profitLabel: "PROFIT/LOSS",
      topTraders: "Top Traders",
    },
  };

  const t = translations[lang as keyof typeof translations];

  useEffect(() => {
    fetch
      .get("/api/wallet/rank")
      .then((data) => setDataRanks(data))
      .catch((err) => console.error("Erreur API:", err));
  }, []);

  const myPerformance = useMemo(() => {
    if (!dataRanks || !user || !Array.isArray(dataRanks)) return null;

    const sortedData = [...dataRanks]
      .filter((item: any) => item?.user?.isAdmin === false)
      .sort(
        (a: any, b: any) =>
          (Number(b.publicWalletValue) || 0) -
          (Number(a.publicWalletValue) || 0)
      );

    const myIndex = sortedData.findIndex(
      (item: any) => item?.user?.id === (user as any)?.id
    );

    if (myIndex === -1) return null;

    const myData = sortedData[myIndex];
    const STARTING_CASH = 10000;
    const totalValue = Number(myData.publicWalletValue) || 0;

    return {
      rank: myIndex + 1,
      total: totalValue,
      profit: totalValue - STARTING_CASH,
      percent: ((totalValue - STARTING_CASH) / STARTING_CASH) * 100,
    };
  }, [dataRanks, user]);

  return (
    <>
      <Head>
        <title>{t.headTitle}</title>
        <link rel="icon" href="/favicon3.ico" />
      </Head>
      <main className={homeStyles.pageContainer}>
        <div
          className={homeStyles.marketHeader}
          style={{ marginBottom: "30px" }}
        >
          <div>
            <h1 className={homeStyles.marketTitle}>{t.title}</h1>
            <p className={homeStyles.marketSub}>{t.sub}</p>
          </div>
          <div className={homeStyles.rankIconBadge}>🏆</div>
        </div>

        <div className={homeStyles.performanceCard}>
          <div className={homeStyles.perfHeader}>
            <span className={homeStyles.perfTitle}>{t.perfTitle}</span>
            <span className={homeStyles.rankBadge}>
              {myPerformance
                ? `${t.rankLabel}${myPerformance.rank}`
                : `${t.rankLabel}--`}
            </span>
          </div>
          <div className={homeStyles.perfGrid}>
            <div className={homeStyles.perfItem}>
              <label>{t.cashLabel}</label>
              <div className={homeStyles.perfValue}>
                {myPerformance
                  ? myPerformance.total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })
                  : "0.00"}{" "}
                $
              </div>
            </div>
            <div className={homeStyles.perfItem}>
              <label>{t.profitLabel}</label>
              <div
                className={homeStyles.perfValue}
                style={{
                  color:
                    (myPerformance?.profit || 0) >= 0 ? "#2ecc71" : "#e74c3c",
                }}
              >
                {myPerformance
                  ? `${myPerformance.profit >= 0 ? "+" : ""}${myPerformance.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  : "0.00"}{" "}
                $
              </div>
            </div>
          </div>
        </div>

        <div
          className={homeStyles.assetCard}
          style={{ marginTop: "40px", padding: "30px", backgroundColor: "#fff" }}
        >
          <h3 style={{ marginBottom: "25px", fontWeight: "700" }}>
            {t.topTraders}
          </h3>
          <TableRanks
            data={dataRanks as any}
            selectedId={selectedId || 0}
            lang={lang}
          />
        </div>
      </main>
    </>
  );
}

Ranks.getLayout = (page: React.ReactNode) => (
  <DashBoardLayout>{page}</DashBoardLayout>
);