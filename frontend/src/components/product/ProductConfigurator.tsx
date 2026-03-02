import { useState, useMemo } from 'react';
import type { Product, ProductOption } from '@/types/product';
import { StepIndicator } from './StepIndicator';
import { PricingSummary } from './PricingSummary';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { formatCurrency, formatPrice } from '@/lib/currency';

// Dimensional pricing configuration passed from parent
export interface DimensionalPricingConfig {
  ratePerUnit: number;
  unit: 'sqft' | 'sqin' | 'sqm' | 'sqcm';
  minCharge: number;
}

interface ProductConfiguratorProps {
  product: Product;
  dimensionalPricing?: DimensionalPricingConfig | null;
}

export function ProductConfigurator({ product, dimensionalPricing }: ProductConfiguratorProps) {
  const navigate = useNavigate();
  const { addItem } = useCart();

  // Dimensional pricing state (width, height, pieces)
  const [dimensions, setDimensions] = useState({
    width: 10,
    height: 10,
    pieces: 1,
  });

  // Check if product has pricing tiers and quantity option
  const hasQuantityOption = product.options.some(o => o.type === 'quantity');
  const hasPricingTiers = product.pricingTiers && product.pricingTiers.length > 0;

  // Initialize configuration with first option of each select
  const initialConfig: Record<string, string | number> = {};
  
  // Add quantity config if product has pricing tiers
  if (hasPricingTiers && !hasQuantityOption) {
    initialConfig['quantity'] = product.minQuantity;
  }
  
  product.options.forEach((option) => {
    if (option.type === 'select' || option.type === 'radio') {
      initialConfig[option.id] = option.options?.[0]?.value || '';
    } else if (option.type === 'dimension') {
      initialConfig[option.id] = option.min || 1;
    } else if (option.type === 'quantity') {
      initialConfig[option.id] = product.minQuantity;
    }
  });

  const [configuration, setConfiguration] = useState<Record<string, string | number>>(initialConfig);
  const [currentStep, setCurrentStep] = useState(1);

  // Helper to get unit label
  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case 'sqft': return 'sq ft';
      case 'sqin': return 'sq in';
      case 'sqm': return 'sq m';
      case 'sqcm': return 'sq cm';
      default: return unit;
    }
  };

  // Create steps from options - add dimensions step if dimensional pricing enabled
  // Also add quantity step if product has pricing tiers and no quantity option exists
  const quantityOption: ProductOption = {
    id: 'quantity',
    name: 'Quantity',
    type: 'quantity',
  };

  const baseSteps = [
    ...(hasPricingTiers && !hasQuantityOption ? [quantityOption] : []),
    ...product.options,
  ].map((option, index) => ({
    id: index + 1,
    name: option.name,
    option,
  }));

  // Add dimensions step if dimensional pricing is enabled
  const steps = dimensionalPricing
    ? [{ id: 1, name: 'Dimensions', option: null as ProductOption | null }, ...baseSteps.map(s => ({ ...s, id: s.id + 1 }))]
    : baseSteps;

  const currentOption = steps[currentStep - 1]?.option;
  const isDimensionStep = dimensionalPricing && currentStep === 1;

  // Calculate dimensional price breakdown
  const dimensionalBreakdown = useMemo(() => {
    if (!dimensionalPricing) return null;

    const area = dimensions.width * dimensions.height;
    let dimensionalCost = area * dimensionalPricing.ratePerUnit;

    // Apply minimum charge
    if (dimensionalCost < dimensionalPricing.minCharge) {
      dimensionalCost = dimensionalPricing.minCharge;
    }

    const totalForPieces = dimensionalCost * dimensions.pieces;

    return {
      area,
      dimensionalCost,
      pieces: dimensions.pieces,
      total: totalForPieces,
    };
  }, [dimensions, dimensionalPricing]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    // Get quantity from configuration - check both product.options and pricing tiers
    const hasExplicitQuantityOption = product.options.some((o) => o.id === 'quantity');
    const hasTiers = product.pricingTiers && product.pricingTiers.length > 0;
    const quantity = hasExplicitQuantityOption || hasTiers
      ? parseInt(String(configuration.quantity), 10) || product.minQuantity
      : 1;

    // If pricing tiers exist, find the applicable tier price
    if (product.pricingTiers && product.pricingTiers.length > 0) {
      const tier = product.pricingTiers.find(
        (t) => quantity >= t.minQty && (!t.maxQty || quantity <= t.maxQty)
      );
      if (tier) {
        return tier.price * quantity;
      }
    }

    // If dimensional pricing is enabled, use that calculation
    if (dimensionalPricing && dimensionalBreakdown) {
      let price = dimensionalBreakdown.total;

      // Add option modifiers
      product.options.forEach((option) => {
        const selectedValue = configuration[option.id];
        if (option.type === 'select' || option.type === 'radio') {
          const selectedOption = option.options?.find((o) => o.value === selectedValue);
          if (selectedOption?.priceModifier) {
            price += selectedOption.priceModifier * dimensions.pieces;
          }
        }
      });

      return price;
    }

    // Standard pricing calculation
    let price = product.basePrice;

    product.options.forEach((option) => {
      const selectedValue = configuration[option.id];

      if (option.type === 'select' || option.type === 'radio') {
        const selectedOption = option.options?.find((o) => o.value === selectedValue);
        if (selectedOption?.priceModifier) {
          price += selectedOption.priceModifier;
        }
      } else if (option.type === 'dimension' && typeof selectedValue === 'number') {
        // For dimensional products, calculate by square footage
        const otherDimension = option.id === 'width'
          ? configuration['height'] as number
          : configuration['width'] as number;
        if (otherDimension) {
          price = product.basePrice * selectedValue * otherDimension;
        }
      }
    });

    return price * quantity;
  }, [configuration, product, dimensionalPricing, dimensionalBreakdown, dimensions.pieces]);

  // Get quantity for display
  const quantity = useMemo(() => {
    const hasExplicitQuantityOption = product.options.some((o) => o.id === 'quantity');
    const hasTiers = product.pricingTiers && product.pricingTiers.length > 0;
    if (hasExplicitQuantityOption || hasTiers) {
      const qtyValue = configuration['quantity'];
      return parseInt(String(qtyValue), 10) || product.minQuantity;
    }
    return 1;
  }, [configuration, product]);

  const handleOptionChange = (optionId: string, value: string | number) => {
    setConfiguration((prev) => ({
      ...prev,
      [optionId]: value,
    }));
  };

  const handleAddToCart = () => {
    addItem(product, quantity, configuration, totalPrice);
    toast.success(`${product.name} added to cart!`);
    navigate('/cart');
  };

  const renderOptionSelector = (option: ProductOption) => {
    const currentValue = configuration[option.id];

    if (option.type === 'select' || option.type === 'radio') {
      return (
        <div className="space-y-3">
          <Label className="text-base font-medium">{option.name}</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {option.options?.map((opt) => {
              const isSelected = currentValue === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleOptionChange(option.id, opt.value)}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="font-medium">{opt.label}</span>
                  </div>
                  {opt.priceModifier !== 0 && opt.priceModifier !== undefined && (
                    <span className={cn(
                      'text-sm font-medium',
                      opt.priceModifier > 0 ? 'text-muted-foreground' : 'text-success'
                    )}>
                      {opt.priceModifier > 0 ? '+' : ''}{formatCurrency(opt.priceModifier)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (option.type === 'dimension') {
      const value = currentValue as number;
      return (
        <div className="space-y-4">
          <Label className="text-base font-medium">
            {option.name}: {value} {option.unit}
          </Label>
          <input
            type="range"
            min={option.min}
            max={option.max}
            step={option.step}
            value={value}
            onChange={(e) => handleOptionChange(option.id, parseFloat(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{option.min} {option.unit}</span>
            <span>{option.max} {option.unit}</span>
          </div>
        </div>
      );
    }

    if (option.type === 'quantity') {
      const qtyValue = parseInt(String(currentValue), 10) || product.minQuantity;
      return (
        <div className="space-y-4">
          <Label className="text-base font-medium">{option.name}</Label>
          
          {/* Pricing Tiers Display */}
          {product.pricingTiers && product.pricingTiers.length > 0 && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Quantity Pricing:</p>
              <div className="space-y-2">
                {product.pricingTiers.map((tier) => (
                  <div 
                    key={tier.id}
                    className={cn(
                      'flex justify-between items-center p-2 rounded text-sm',
                      qtyValue >= tier.minQty && (!tier.maxQty || qtyValue <= tier.maxQty)
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-background'
                    )}
                  >
                    <span>
                      {tier.minQty}
                      {tier.maxQty ? ` - ${tier.maxQty}` : '+'}
                      {' '}units
                    </span>
                    <span className="font-semibold">₦{tier.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOptionChange(option.id, Math.max(product.minQuantity, qtyValue - 1))}
              disabled={qtyValue <= product.minQuantity}
            >
              -
            </Button>
            <Input
              type="number"
              min={product.minQuantity}
              value={qtyValue}
              onChange={(e) => handleOptionChange(option.id, parseInt(e.target.value) || product.minQuantity)}
              className="w-20 text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOptionChange(option.id, qtyValue + 1)}
            >
              +
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Minimum order: {product.minQuantity} units</p>
        </div>
      );
    }

    return null;
  };

  // Render dimensional pricing input section
  const renderDimensionalPricingInput = () => {
    if (!dimensionalPricing) return null;

    return (
      <div className="space-y-6">
        <Label className="text-base font-medium">Enter Dimensions</Label>
        <p className="text-sm text-muted-foreground">
          Enter the width and height of your product. Price is calculated based on area ({getUnitLabel(dimensionalPricing.unit)}).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dim-width" className="text-sm">Width</Label>
            <div className="relative">
              <Input
                id="dim-width"
                type="number"
                min={1}
                step={0.1}
                value={dimensions.width}
                onChange={(e) => setDimensions(prev => ({ ...prev, width: parseFloat(e.target.value) || 1 }))}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {dimensionalPricing.unit.replace('sq', '')}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dim-height" className="text-sm">Height</Label>
            <div className="relative">
              <Input
                id="dim-height"
                type="number"
                min={1}
                step={0.1}
                value={dimensions.height}
                onChange={(e) => setDimensions(prev => ({ ...prev, height: parseFloat(e.target.value) || 1 }))}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {dimensionalPricing.unit.replace('sq', '')}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dim-pieces" className="text-sm">Number of Pieces</Label>
            <Input
              id="dim-pieces"
              type="number"
              min={1}
              step={1}
              value={dimensions.pieces}
              onChange={(e) => setDimensions(prev => ({ ...prev, pieces: parseInt(e.target.value) || 1 }))}
            />
          </div>
        </div>

        {/* Price Breakdown */}
        {dimensionalBreakdown && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Price Breakdown</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Area:</span>
              <span>{dimensionalBreakdown.area.toFixed(2)} {getUnitLabel(dimensionalPricing.unit)}</span>

              <span className="text-muted-foreground">Rate:</span>
              <span>{formatPrice(dimensionalPricing.ratePerUnit)} per {getUnitLabel(dimensionalPricing.unit)}</span>

              <span className="text-muted-foreground">Cost per piece:</span>
              <span>{formatPrice(dimensionalBreakdown.dimensionalCost)}</span>

              {dimensionalPricing.minCharge > 0 && dimensionalBreakdown.area * dimensionalPricing.ratePerUnit < dimensionalPricing.minCharge && (
                <>
                  <span className="text-muted-foreground">Min. charge applied:</span>
                  <span className="text-amber-600">{formatPrice(dimensionalPricing.minCharge)}</span>
                </>
              )}

              <span className="text-muted-foreground">Pieces:</span>
              <span>× {dimensionalBreakdown.pieces}</span>

              <span className="font-medium border-t border-border pt-2">Dimensional Total:</span>
              <span className="font-medium border-t border-border pt-2">{formatPrice(dimensionalBreakdown.total)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main configurator */}
      <div className="lg:col-span-2">
        <StepIndicator
          steps={steps.map((s) => ({ id: s.id, name: s.name }))}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />

        <div className="bg-card border border-border rounded-lg p-6">
          {/* Show dimensional pricing input on first step if enabled */}
          {isDimensionStep && renderDimensionalPricingInput()}

          {/* Show regular option selector for other steps */}
          {!isDimensionStep && currentOption && renderOptionSelector(currentOption)}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep < steps.length ? (
              <Button
                onClick={() => setCurrentStep((prev) => Math.min(steps.length, prev + 1))}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button variant="cta" onClick={handleAddToCart}>
                Add to Cart
              </Button>
            )}
          </div>
        </div>

        {/* Configuration summary */}
        <div className="mt-6 bg-muted/50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Your Configuration</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {product.options.map((option) => {
              const value = configuration[option.id];
              let displayValue = String(value);
              
              if (option.type === 'select' || option.type === 'radio') {
                const selectedOpt = option.options?.find((o) => o.value === value);
                displayValue = selectedOpt?.label || String(value);
              } else if (option.type === 'dimension') {
                displayValue = `${value} ${option.unit}`;
              }
              
              return (
                <div key={option.id} className="text-sm">
                  <span className="text-muted-foreground">{option.name}:</span>
                  <br />
                  <span className="font-medium">{displayValue}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pricing sidebar */}
      <div className="lg:col-span-1">
        <PricingSummary
          basePrice={product.basePrice}
          totalPrice={totalPrice}
          quantity={quantity}
          turnaround={product.turnaround}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  );
}
