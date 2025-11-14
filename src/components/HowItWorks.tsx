import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, FileText, Gavel, Car } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Search,
      title: "Browse & Search",
      description: "Explore our curated collection of enthusiast vehicles with detailed photos and specifications.",
    },
    {
      icon: FileText,
      title: "Review Details",
      description: "Access comprehensive vehicle history, seller information, and condition reports.",
    },
    {
      icon: Gavel,
      title: "Place Your Bid",
      description: "Bid with confidence knowing all transactions are secure and transparent.",
    },
    {
      icon: Car,
      title: "Win & Arrange",
      description: "Complete the purchase and arrange secure delivery or pickup of your dream car.",
    },
  ];

  return (
    <section className="bg-muted/50 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <Badge className="mb-4">Simple Process</Badge>
          <h2 className="text-3xl font-bold sm:text-4xl">How It Works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Four easy steps to buying or selling your enthusiast vehicle
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
