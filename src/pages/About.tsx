import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Car, Shield, Clock, Users } from "lucide-react";

const About = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-6 text-4xl font-bold md:text-5xl">
                About BidWheels
              </h1>
              <p className="text-lg text-muted-foreground">
                The premier online auction platform connecting enthusiast vehicle
                sellers with passionate buyers worldwide.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <h2 className="mb-8 text-center text-3xl font-bold">Our Mission</h2>
              <p className="mb-6 text-lg text-muted-foreground">
                BidWheels was founded with a simple yet powerful vision: to create
                a transparent, efficient, and trustworthy marketplace for
                enthusiast vehicles. We believe that buying and selling special
                cars should be an exciting experience, not a stressful one.
              </p>
              <p className="text-lg text-muted-foreground">
                Our platform combines cutting-edge technology with automotive
                passion to deliver a premium auction experience that puts sellers
                and buyers first.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              What Sets Us Apart
            </h2>
            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Trust & Safety</h3>
                <p className="text-muted-foreground">
                  Verified sellers, secure payments, and comprehensive vehicle
                  documentation.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Fast & Fair</h3>
                <p className="text-muted-foreground">
                  Real-time bidding with transparent pricing and instant
                  notifications.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Car className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Quality Focus</h3>
                <p className="text-muted-foreground">
                  Curated selection of enthusiast vehicles with detailed
                  documentation.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Community</h3>
                <p className="text-muted-foreground">
                  Join thousands of passionate automotive enthusiasts worldwide.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-4xl gap-8 text-center md:grid-cols-3">
              <div>
                <div className="mb-2 text-4xl font-bold text-primary">10K+</div>
                <div className="text-muted-foreground">Vehicles Sold</div>
              </div>
              <div>
                <div className="mb-2 text-4xl font-bold text-primary">50K+</div>
                <div className="text-muted-foreground">Active Members</div>
              </div>
              <div>
                <div className="mb-2 text-4xl font-bold text-primary">98%</div>
                <div className="text-muted-foreground">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary py-16 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
            <p className="mb-8 text-lg opacity-90">
              Join our community of automotive enthusiasts today.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/auctions"
                className="inline-flex h-11 items-center justify-center rounded-md bg-background px-8 text-sm font-medium text-foreground transition-colors hover:bg-background/90"
              >
                Browse Auctions
              </a>
              <a
                href="/sell"
                className="inline-flex h-11 items-center justify-center rounded-md border-2 border-background px-8 text-sm font-medium transition-colors hover:bg-background/10"
              >
                List Your Vehicle
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
