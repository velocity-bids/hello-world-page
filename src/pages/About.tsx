import { Car, Shield, Clock, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

const About = () => {
  const { t } = useTranslation();

  const values = [
    {
      icon: Shield,
      title: t("translation:about.trustSafetyTitle"),
      description: t("translation:about.trustSafetyDescription"),
    },
    {
      icon: Clock,
      title: t("translation:about.fastFairTitle"),
      description: t("translation:about.fastFairDescription"),
    },
    {
      icon: Car,
      title: t("translation:about.qualityFocusTitle"),
      description: t("translation:about.qualityFocusDescription"),
    },
    {
      icon: Users,
      title: t("translation:about.communityTitle"),
      description: t("translation:about.communityDescription"),
    },
  ];

  const stats = [
    { value: "10K+", label: t("translation:about.vehiclesSold") },
    { value: "50K+", label: t("translation:about.activeMembers") },
    { value: "98%", label: t("translation:about.satisfactionRate") },
  ];

  return (
    <main className="flex-1">
      <section className="bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">{t("translation:about.title")}</h1>
            <p className="text-lg text-muted-foreground">{t("translation:about.heroDescription")}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 text-center text-3xl font-bold">{t("translation:about.missionTitle")}</h2>
            <p className="mb-6 text-lg text-muted-foreground">{t("translation:about.missionParagraph1")}</p>
            <p className="text-lg text-muted-foreground">{t("translation:about.missionParagraph2")}</p>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">{t("translation:about.whatSetsUsApart")}</h2>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-4xl gap-8 text-center md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="mb-2 text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">{t("translation:about.ctaTitle")}</h2>
          <p className="mb-8 text-lg opacity-90">{t("translation:about.ctaDescription")}</p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/auctions"
              className="inline-flex h-11 items-center justify-center rounded-md bg-background px-8 text-sm font-medium text-foreground transition-colors hover:bg-background/90"
            >
              {t("translation:about.browseAuctions")}
            </a>
            <a
              href="/sell"
              className="inline-flex h-11 items-center justify-center rounded-md border-2 border-background px-8 text-sm font-medium transition-colors hover:bg-background/10"
            >
              {t("translation:about.listYourVehicle")}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;
