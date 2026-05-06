import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVehicleBrands } from "@/hooks/useVehicleBrands";
import { getVehicleModels } from "@/db/queries";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1989 }, (_, i) => CURRENT_YEAR - i);

const PremiumHero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { brands } = useVehicleBrands();

  const [brand, setBrand] = useState("any");
  const [model, setModel] = useState("any");
  const [yearFrom, setYearFrom] = useState("any");
  const [yearTo, setYearTo] = useState("any");
  const [maxMileage, setMaxMileage] = useState("any");
  const [models, setModels] = useState<string[]>([]);

  const mileageOptions = [
    { label: t("translation:vehicle.anyMileage"), value: "any" },
    { label: t("translation:vehicle.mileageUpTo", { mileage: "10,000" }), value: "10000" },
    { label: t("translation:vehicle.mileageUpTo", { mileage: "25,000" }), value: "25000" },
    { label: t("translation:vehicle.mileageUpTo", { mileage: "50,000" }), value: "50000" },
    { label: t("translation:vehicle.mileageUpTo", { mileage: "75,000" }), value: "75000" },
    { label: t("translation:vehicle.mileageUpTo", { mileage: "100,000" }), value: "100000" },
    { label: t("translation:vehicle.mileageUpTo", { mileage: "150,000" }), value: "150000" },
    { label: t("translation:vehicle.mileageUpTo", { mileage: "200,000" }), value: "200000" },
  ];

  useEffect(() => {
    if (brand && brand !== "any") {
      getVehicleModels(brand).then(({ data }) => setModels(data));
    } else {
      setModels([]);
      setModel("any");
    }
  }, [brand]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (brand !== "any") params.set("translation:brand", brand);
    if (model !== "any") params.set("translation:model", model);
    if (yearFrom !== "any") params.set("translation:yearFrom", yearFrom);
    if (yearTo !== "any") params.set("translation:yearTo", yearTo);
    if (maxMileage !== "any") params.set("translation:maxMileage", maxMileage);
    navigate(`/auctions?${params.toString()}`);
  };

  const yearFromNum = yearFrom !== "any" ? parseInt(yearFrom) : undefined;
  const yearToNum = yearTo !== "any" ? parseInt(yearTo) : undefined;

  return (
    <section className="relative w-full bg-background">
      <div className="relative border-b border-border bg-gradient-to-br from-automotive-dark via-automotive-dark/95 to-automotive-dark/90">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCA2YzAgLjU1Mi0uNDQ4IDEtMSAxcy0xLS40NDgtMS0xIC40NDgtMSAxLTEgMSAuNDQ4IDEgMXoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wMiIvPjwvZz48L3N2Zz4=')] opacity-50" />

        <div className="container relative mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="space-y-3 text-center">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-automotive-light md:text-5xl">
                {t("translation:auctions.findYourNext")}{" "}
                <span className="bg-gradient-to-r from-accent via-accent/90 to-accent/70 bg-clip-text text-transparent">
                  {t("translation:auctions.auction")}
                </span>
              </h1>
              <p className="text-lg text-automotive-light/70">{t("translation:auctions.heroDescription")}</p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/95 p-6 shadow-2xl backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("translation:vehicle.make")}</label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("translation:vehicle.anyMake")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t("translation:vehicle.anyMake")}</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("translation:vehicle.model")}</label>
                  <Select value={model} onValueChange={setModel} disabled={brand === "any" || models.length === 0}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("translation:vehicle.anyModel")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t("translation:vehicle.anyModel")}</SelectItem>
                      {models.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("translation:vehicle.yearFrom")}</label>
                  <Select value={yearFrom} onValueChange={(v) => { setYearFrom(v); if (yearToNum && parseInt(v) > yearToNum) setYearTo(v); }}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("translation:vehicle.anyYear")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t("translation:vehicle.anyYear")}</SelectItem>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("translation:vehicle.yearTo")}</label>
                  <Select value={yearTo} onValueChange={setYearTo}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("translation:vehicle.anyYear")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t("translation:vehicle.anyYear")}</SelectItem>
                      {YEARS.filter((y) => !yearFromNum || y >= yearFromNum).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("translation:vehicle.maxMileage")}</label>
                  <Select value={maxMileage} onValueChange={setMaxMileage}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("translation:vehicle.anyMileage")} />
                    </SelectTrigger>
                    <SelectContent>
                      {mileageOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="select-none text-xs font-medium uppercase tracking-wide text-transparent">{t("translation:common.search")}</label>
                  <Button className="h-11 w-full gap-2 bg-accent text-base font-semibold text-accent-foreground hover:bg-accent/90" onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                    {t("translation:auctions.searchAuctions")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PremiumHero;
