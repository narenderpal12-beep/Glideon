import { Link } from "wouter";
import { ArrowLeft, AlertCircle, HelpCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Returns() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-glideon-red hover:text-red-700 mb-4 mx-auto"
              data-testid="back-home"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
          <h1
            className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
            data-testid="returns-title"
          >
            No Return & No Refund Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Please review our policy before making a purchase.
          </p>
        </div>

        {/* Important Notice */}
        <Alert className="mb-8 border-glideon-red/20 bg-glideon-red/5">
          <AlertCircle className="h-4 w-4 text-glideon-red" />
          <AlertDescription className="text-gray-700 dark:text-gray-300">
            <strong>All Sales Are Final:</strong> Due to the nature of our
            products and services, we do not accept returns or issue refunds
            once an order has been placed and processed.
          </AlertDescription>
        </Alert>

        {/* Policy Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-glideon-red">
              Policy Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              We take great care to ensure product quality and accurate
              descriptions. Please verify your order before completing the
              checkout process.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>All purchases are non-refundable and non-returnable.</li>
              <li>
                Orders once placed cannot be canceled after they are processed.
              </li>
              <li>
                Defective or damaged items may be replaced at our discretion
                after verification.
              </li>
              <li>
                Any disputes or special cases will be handled by our customer
                support team.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="border-glideon-red/20 bg-glideon-red/5">
          <CardContent className="p-8 text-center">
            <HelpCircle className="mx-auto h-10 w-10 text-glideon-red mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Need Help or Found an Issue?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              If you received a defective or incorrect item, please reach out on  glideonhealth@gmail.com
              to our support team within 48 hours of delivery. We’ll review your
              case and assist you promptly.
            </p>
         
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
