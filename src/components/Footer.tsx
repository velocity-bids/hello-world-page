import { Car } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="mb-4 flex items-center gap-2">
              <Car className="h-6 w-6" />
              <span className="text-xl font-bold">BidWheels</span>
            </Link>
            <p className="text-sm text-muted-foreground">{t("translation:translation:footer.tagline")}</p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">{t("translation:footer.company")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="transition-colors hover:text-foreground">
                  {t("translation:footer.aboutUs")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition-colors hover:text-foreground">
                  {t("translation:footer.contact")}
                </Link>
              </li>
              <li>
                <Link to="/careers" className="transition-colors hover:text-foreground">
                  {t("translation:footer.careers")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">{t("translation:footer.resources")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/how-it-works" className="transition-colors hover:text-foreground">
                  {t("translation:footer.howItWorks")}
                </Link>
              </li>
              <li>
                <Link to="/seller-guide" className="transition-colors hover:text-foreground">
                  {t("translation:footer.sellerGuide")}
                </Link>
              </li>
              <li>
                <Link to="/buyer-guide" className="transition-colors hover:text-foreground">
                  {t("translation:footer.buyerGuide")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">{t("translation:footer.legal")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/terms" className="transition-colors hover:text-foreground">
                  {t("translation:footer.terms")}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="transition-colors hover:text-foreground">
                  {t("translation:footer.privacy")}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="transition-colors hover:text-foreground">
                  {t("translation:footer.cookies")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>{t("translation:footer.rightsReserved")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
