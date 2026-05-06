import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, FileText, Gavel, Car } from "lucide-react";
import { useTranslation } from "react-i18next";

const HowItWorks = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Search,
      title: t("translation:about.browseSearchTitle"),
      description: t("translation:about.browseSearchDescription"),
    },
    {
      icon: FileText,
      title: t("translation:about.reviewDetailsTitle"),
      description: t("translation:about.reviewDetailsDescription"),
    },
    {
      icon: Gavel,
      title: t("translation:about.placeBidTitle"),
      description: t("translation:about.placeBidDescription"),
    },
    {
      icon: Car,
      title: t("translation:about.winArrangeTitle"),
      description: t("translation:about.winArrangeDescription"),
    },
  ];

  return (
    <section className="bg-muted/50 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <Badge className="mb-4">{t("translation:about.simpleProcess")}</Badge>
          <h2 className="text-3xl font-bold sm:text-4xl">{t("translation:about.howItWorks")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t("translation:about.howItWorksDescription")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Card key={index} className="relative p-6">
              <div className="absolute -right-4 -top-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl font-bold text-accent-foreground shadow-glow">
                {index + 1}
              </div>
              <div className="mb-4 inline-flex rounded-lg bg-primary p-3 text-primary-foreground">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
