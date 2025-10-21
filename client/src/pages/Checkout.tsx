import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CreditCard, Lock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@shared/schema";

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  name?: string;
  mobile?: string;
  appliedOffer?: any; // add appliedOffer here
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const { cartItems, clearCart } = useCart();

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "IN",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [isProcessing, setIsProcessing] = useState(false);
  const [offerCode, setOfferCode] = useState("");
  const [appliedOffer, setAppliedOffer] = useState<any>(null);
  const [offerValidationError, setOfferValidationError] = useState("");

  // Fetch products for the cart
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: cartItems.length > 0,
  });

  // Mutation: create order
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (order) => {
      clearCart();
      toast({
        title: "Order placed successfully!",
        description: `Your order #${order.id.slice(-8)} has been confirmed.`,
      });
      navigate("/profile");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Order failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation: validate offer code
  const validateOfferMutation = useMutation({
    mutationFn: async (code: string) => {
      const subtotal = calculateCartTotal();
      const response = await apiRequest("POST", "/api/validate-offer-code-new", {
        code: code.trim().toUpperCase(),
        cartTotal: subtotal,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAppliedOffer(data);
      setOfferValidationError("");
      toast({
        title: "Offer applied!",
        description: `You saved ${formatPrice(data.discountAmount)} with code ${data.offer.code}`,
      });
    },
    onError: (error: any) => {
      setAppliedOffer(null);
      setOfferValidationError(error.message || "Invalid offer code");
      toast({
        title: "Invalid offer code",
        description: error.message || "Please check your code and try again",
        variant: "destructive",
      });
    },
  });

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to continue
          </h1>
          <Button
            onClick={() => window.location.href = "/api/login"}
            className="bg-glideon-red hover:bg-red-700 text-white"
          >
            Sign In
          </Button>
        </main>
      </div>
    );
  }

  // Redirect if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Your cart is empty
          </h1>
          <Link href="/products">
            <Button className="bg-glideon-red hover:bg-red-700 text-white">
              Continue Shopping
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  // Helpers
  const getProductById = (productId: string) => {
    return products?.find((p) => p.id === productId);
  };

  const calculateItemTotal = (item: any) => {
    let price = 0;
    if (item.variant?.price) {
      price = item.variant.salePrice ? parseFloat(item.variant.salePrice) : parseFloat(item.variant.price);
    } else {
      const product = getProductById(item.productId);
      if (product) {
        price = product.salePrice ? parseFloat(product.salePrice) : parseFloat(product.price);
      }
    }
    return price * item.quantity;
  };

  const calculateCartTotal = () => {
    return cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyOfferCode = () => {
    if (!offerCode.trim()) {
      setOfferValidationError("Please enter an offer code");
      return;
    }
    validateOfferMutation.mutate(offerCode.trim());
  };

  const handleRemoveOfferCode = () => {
    setAppliedOffer(null);
    setOfferCode("");
    setOfferValidationError("");
  };

  const subtotal = calculateCartTotal();
  const discount = appliedOffer ? appliedOffer.discountAmount : 0;
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const tax = (subtotal - discount) * 0.00;
  const finalTotal = subtotal - discount + shipping + tax;

  const enrichedCartItems = cartItems.map((item) => {
    const product = getProductById(item.productId);
    return {
      productId: item.productId,
      productName: product?.name || "",
      variantId: item.variant?.id || null,
      variant: item.variant
        ? {
            id: item.variant.id,
            size: item.variant.size,
            unit: item.variant.unit,
            flavor: item.variant.flavor,
            price: item.variant.salePrice ? parseFloat(item.variant.salePrice) : parseFloat(item.variant.price),
          }
        : null,
      quantity: item.quantity,
      price: calculateItemTotal(item),
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      toast({
        title: "Missing information",
        description: "Please fill in all shipping address fields.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      createOrderMutation.mutate({
        total: finalTotal.toFixed(2),
        shippingAddress: {
          ...shippingAddress,
          appliedOffer, // ✅ include appliedOffer here
        },
        cartItems: enrichedCartItems,
        paymentMethod,
        paymentStatus: "paid",
        status: "processing",
        appliedOffer,
      });
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart">
            <Button variant="ghost" className="flex items-center space-x-2 text-glideon-red hover:text-red-700 mb-4">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Cart</span>
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Shipping & Payment */}
          <div className="space-y-6">
            {/* Shipping */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={shippingAddress.name || ""}
                    onChange={(e) => handleAddressChange("name", e.target.value)}
                    placeholder="Ram Kumar"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={shippingAddress.mobile || ""}
                    onChange={(e) => handleAddressChange("mobile", e.target.value)}
                    placeholder="+91 888 143 2340"
                    required
                  />
                </div>
           
                </div>
                <div>
                  <Label htmlFor="street">Address</Label>
                  <Input
                    id="street"
                    value={shippingAddress.street}
                    onChange={(e) => handleAddressChange("street", e.target.value)}
                    placeholder="1456 Main Bazzar"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => handleAddressChange("city", e.target.value)}
                      placeholder="Sirsa"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => handleAddressChange("state", e.target.value)}
                      placeholder="HR"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={(e) => handleAddressChange("zipCode", e.target.value)}
                      placeholder="10001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select value={shippingAddress.country} onValueChange={(value) => handleAddressChange("country", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN">India</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                        
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="JP">Japan</SelectItem>
                          <SelectItem value="CN">China</SelectItem>
                          <SelectItem value="BR">Brazil</SelectItem>
                          <SelectItem value="IT">Italy</SelectItem>
                          <SelectItem value="ES">Spain</SelectItem>
                          <SelectItem value="MX">Mexico</SelectItem>
                          <SelectItem value="ZA">South Africa</SelectItem>
                          <SelectItem value="RU">Russia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-4 border-2 border-glideon-red bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <input
                    type="radio"
                    id="cash_on_delivery"
                    name="payment_method"
                    value="cash_on_delivery"
                    checked={paymentMethod === "cash_on_delivery"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <label htmlFor="cash_on_delivery" className="flex-1 cursor-pointer">
                    <div className="font-semibold text-gray-900 dark:text-white">Cash on Delivery</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Pay when your order arrives</div>
                  </label>
                  <div className="text-green-600 font-semibold text-sm">Available</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {cartItems.map((item) => {
                  const product = getProductById(item.productId);
                  if (!product) return null;
                  const price = item.variant?.salePrice ? parseFloat(item.variant.salePrice) : parseFloat(product.salePrice || product.price);
                  const imageUrl = product.images?.[0] || "https://via.placeholder.com/100";
                  return (
                    <div key={item.productId} className="flex items-center space-x-3 mb-4">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        {item.variant && (
                          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {item.variant.size} {item.variant.unit} {item.variant.flavor && `• ${item.variant.flavor}`}
                          </div>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {formatPrice(price)} × {item.quantity}
                        </p>
                      </div>
                      <div className="font-medium">{formatPrice(calculateItemTotal(item))}</div>
                    </div>
                  );
                })}

                {/* Offer Code */}
                {!appliedOffer ? (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                    <Label htmlFor="offer-code" className="text-sm font-medium">Offer Code</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="offer-code"
                        value={offerCode}
                        onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyOfferCode}
                        disabled={!offerCode.trim() || validateOfferMutation.isPending}
                        size="sm"
                        variant="outline"
                      >
                        {validateOfferMutation.isPending ? "Checking..." : "Apply"}
                      </Button>
                    </div>
                    {offerValidationError && <p className="text-sm text-red-600 mt-1">{offerValidationError}</p>}
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">{appliedOffer.offer.title} Applied</p>
                        <p className="text-xs text-green-600 dark:text-green-300">
                          Code: {appliedOffer.offer.code} • Save {formatPrice(appliedOffer.discountAmount)}
                        </p>
                      </div>
                      <Button onClick={handleRemoveOfferCode} size="sm" variant="ghost" className="text-green-700 dark:text-green-300 hover:text-red-600 dark:hover:text-red-400">
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Discount ({appliedOffer.offer.code})</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm nodisplay" >
                    <span>Tax</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-700 pt-3">
                    <span>Total</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                {/* Place Order */}
                <Button
                  type="submit"
                  disabled={isProcessing || createOrderMutation.isPending}
                  className="w-full mt-6 bg-glideon-red hover:bg-red-700 text-white font-semibold py-3"
                >
                  {isProcessing ? "Processing..." : `Place Order - ${formatPrice(finalTotal)}`}
                </Button>

                {/* Security */}
                <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Lock className="h-4 w-4" />
                  <span>Secure 256-bit SSL encryption</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
