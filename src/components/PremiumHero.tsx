import { useState, useEffect } from "react";
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

const MILEAGE_OPTIONS = [
  { label: "Any mileage", value: "any" },
  { label: "Até 10.000 km", value: "10000" },
  { label: "Até 25.000 km", value: "25000" },
  { label: "Até 50.000 km", value: "50000" },
  { label: "Até 75.000 km", value: "75000" },
  { label: "Até 100.000 km", value: "100000" },
  { label: "Até 150.000 km", value: "150000" },
  { label: "Até 200.000 km", value: "200000" },
];

const PremiumHero = () => {
  const navigate = useNavigate();
  const { brands } = useVehicleBrands();

  const [brand, setBrand] = useState("any");
  const [model, setModel] = useState("any");
  const [yearFrom, setYearFrom] = useState("any");
  const [yearTo, setYearTo] = useState("any");
  const [maxMileage, setMaxMileage] = useState("any");
  const [models, setModels] = useState<string[]>([]);

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
    if (brand !== "any") params.set("brand", brand);
    if (model !== "any") params.set("model", model);
    if (yearFrom !== "any") params.set("yearFrom", yearFrom);
    if (yearTo !== "any") params.set("yearTo", yearTo);
    if (maxMileage !== "any") params.set("maxMileage", maxMileage);
    navigate(`/auctions?${params.toString()}`);
  };

  const yearFromNum = yearFrom !== "any" ? parseInt(yearFrom) : undefined;
  const yearToNum = yearTo !== "any" ? parseInt(yearTo) : undefined;

  return (
    <section className="relative w-full bg-background">
      <div className="relative bg-gradient-to-br from-automotive-dark via-automotive-dark/95 to-automotive-dark/90 border-b border-border">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCA2YzAgLjU1Mi0uNDQ4IDEtMSAxcy0xLS40NDgtMS0xIC40NDgtMSAxLTEgMSAuNDQ4IDEgMXoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wMiIvPjwvZz48L3N2Zz4=')] opacity-50" />

        <div className="container relative mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Heading */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-automotive-light leading-tight">
                Find Your Next{" "}
                <span className="bg-gradient-to-r from-accent via-accent/90 to-accent/70 bg-clip-text text-transparent">
                  Auction
                </span>
              </h1>
              <p className="text-automotive-light/70 text-lg">
                Search from hundreds of active vehicle auctions
              </p>
            </div>

            {/* Search card */}
            <div className="bg-background/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-border/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Make */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Make</label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Any make" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any make</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</label>
                  <Select
                    value={model}
                    onValueChange={setModel}
                    disabled={brand === "any" || models.length === 0}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Any model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any model</SelectItem>
                      {models.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year from */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year from</label>
                  <Select value={yearFrom} onValueChange={(v) => { setYearFrom(v); if (yearToNum && parseInt(v) > yearToNum) setYearTo(v); }}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Any year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any year</SelectItem>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Year to */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year to</label>
                  <Select value={yearTo} onValueChange={setYearTo}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Any year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any year</SelectItem>
                      {YEARS.filter((y) => !yearFromNum || y >= yearFromNum).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Max mileage */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max mileage</label>
                  <Select value={maxMileage} onValueChange={setMaxMileage}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Any mileage" />
                    </SelectTrigger>
                    <SelectContent>
                      {MILEAGE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search button */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-transparent uppercase tracking-wide select-none">Search</label>
                  <Button
                    className="w-full h-11 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base"
                    onClick={handleSearch}
                  >
                    <Search className="h-4 w-4" />
                    Search Auctions
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

