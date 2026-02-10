import { useState, useMemo } from 'react';
import type { Product, ProductOption } from '@/types/product';
import { StepIndicator } from './StepIndicator';
import { PricingSummary } from './PricingSummary';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface ProductConfiguratorProps {
  product: Product;
}

export function ProductConfigurator({ product }: ProductConfiguratorProps) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  // Initialize configuration with first option of each select
  const initialConfig: Record<string, string | number> = {};
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

  // Create steps from options
  const steps = product.options.map((option, index) => ({
    id: index + 1,
    name: option.name,
    option,
  }));

  const currentOption = steps[currentStep - 1]?.option;

  // Calculate total price
  const totalPrice = useMemo(() => {
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
    
    return price;
  }, [configuration, product]);

  // Get quantity for display
  const quantity = useMemo(() => {
    const quantityOption = product.options.find((o) => o.id === 'quantity');
    if (quantityOption) {
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

    return null;
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
          {currentOption && renderOptionSelector(currentOption)}

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
