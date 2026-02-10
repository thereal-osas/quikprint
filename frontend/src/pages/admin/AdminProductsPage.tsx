import { useState, useRef } from 'react';
import {
  useAdminProducts,
  useAdminCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2, Upload, X, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { filesApi, type ProductResponse } from '@/services/api';

// Product Option Types
interface ProductOptionValue {
  value: string;
  label: string;
  priceModifier: number;
}

interface ProductOption {
  id: string;
  name: string;
  type: 'select' | 'radio' | 'checkbox';
  options: ProductOptionValue[];
}

interface FormData {
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  shortDescription: string;
  basePrice: string;
  turnaround: string;
  minQuantity: string;
  images: string[];
  pricingType: 'static' | 'dynamic';
  options: ProductOption[];
}

const emptyForm: FormData = {
  name: '',
  slug: '',
  categoryId: '',
  description: '',
  shortDescription: '',
  basePrice: '',
  turnaround: '',
  minQuantity: '1',
  images: [],
  pricingType: 'static',
  options: [],
};

const emptyOption: ProductOption = {
  id: '',
  name: '',
  type: 'select',
  options: [{ value: '', label: '', priceModifier: 0 }],
};

export default function AdminProductsPage() {
  const { data: products, isLoading } = useAdminProducts();
  const { data: categories } = useAdminCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingProduct(null);
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => filesApi.upload(file));
      const results = await Promise.all(uploadPromises);
      const newImageUrls = results.map(r => r.fileUrl);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls],
      }));
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch {
      toast.error('Failed to upload images');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Product option handlers
  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { ...emptyOption, id: `option-${Date.now()}` }],
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const updateOption = (index: number, field: keyof ProductOption, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const addOptionValue = (optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === optionIndex
          ? { ...opt, options: [...opt.options, { value: '', label: '', priceModifier: 0 }] }
          : opt
      ),
    }));
  };

  const removeOptionValue = (optionIndex: number, valueIndex: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === optionIndex
          ? { ...opt, options: opt.options.filter((_, vi) => vi !== valueIndex) }
          : opt
      ),
    }));
  };

  const updateOptionValue = (
    optionIndex: number,
    valueIndex: number,
    field: keyof ProductOptionValue,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === optionIndex
          ? {
              ...opt,
              options: opt.options.map((val, vi) =>
                vi === valueIndex ? { ...val, [field]: value } : val
              ),
            }
          : opt
      ),
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        slug: formData.slug,
        categoryId: formData.categoryId,
        description: formData.description,
        shortDescription: formData.shortDescription,
        basePrice: parseFloat(formData.basePrice) || 0,
        turnaround: formData.turnaround,
        minQuantity: parseInt(formData.minQuantity) || 1,
        images: formData.images,
        options: formData.pricingType === 'dynamic' ? formData.options : [],
      });
      toast.success('Product created successfully');
      setIsCreateOpen(false);
      resetForm();
    } catch {
      toast.error('Failed to create product');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await updateMutation.mutateAsync({
        id: editingProduct.id,
        data: {
          name: formData.name,
          slug: formData.slug,
          categoryId: formData.categoryId,
          description: formData.description,
          shortDescription: formData.shortDescription,
          basePrice: parseFloat(formData.basePrice) || 0,
          turnaround: formData.turnaround,
          minQuantity: parseInt(formData.minQuantity) || 1,
          images: formData.images,
          options: formData.pricingType === 'dynamic' ? formData.options : [],
        },
      });
      toast.success('Product updated successfully');
      setEditingProduct(null);
      resetForm();
    } catch {
      toast.error('Failed to update product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Product deleted successfully');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const openEdit = (product: ProductResponse) => {
    setEditingProduct(product);
    const hasOptions = product.options && Array.isArray(product.options) && product.options.length > 0;
    setFormData({
      name: product.name,
      slug: product.slug,
      categoryId: product.category_id,
      description: product.description || '',
      shortDescription: '',
      basePrice: product.base_price?.toString() || '0',
      turnaround: '',
      minQuantity: '1',
      images: product.images || [],
      pricingType: hasOptions ? 'dynamic' : 'static',
      options: hasOptions ? (product.options as ProductOption[]) : [],
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const ProductForm = ({ onSubmit, isEdit = false, isPending = false }: { onSubmit: (e: React.FormEvent) => void; isEdit?: boolean; isPending?: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={isEdit ? 'edit-name' : 'name'}>Name</Label>
          <Input
            id={isEdit ? 'edit-name' : 'name'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor={isEdit ? 'edit-slug' : 'slug'}>Slug</Label>
          <Input
            id={isEdit ? 'edit-slug' : 'slug'}
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={isEdit ? 'edit-category' : 'category'}>Category</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={isEdit ? 'edit-price' : 'price'}>Base Price (₦)</Label>
          <Input
            id={isEdit ? 'edit-price' : 'price'}
            type="number"
            step="0.01"
            value={formData.basePrice}
            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <Label className="text-base font-semibold">Product Images</Label>
        <div className="flex flex-wrap gap-2">
          {formData.images.map((img, index) => (
            <div key={index} className="relative group w-20 h-20 border border-border rounded overflow-hidden">
              <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-0 right-0 bg-destructive text-destructive-foreground p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="w-20 h-20 border-2 border-dashed border-border rounded flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
          </label>
        </div>
        <p className="text-xs text-muted-foreground">Click to upload product images (PNG, JPG)</p>
      </div>

      {/* Short Description */}
      <div>
        <Label htmlFor={isEdit ? 'edit-short-desc' : 'short-desc'}>Short Description</Label>
        <Input
          id={isEdit ? 'edit-short-desc' : 'short-desc'}
          value={formData.shortDescription}
          onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor={isEdit ? 'edit-desc' : 'desc'}>Description</Label>
        <Textarea
          id={isEdit ? 'edit-desc' : 'desc'}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={isEdit ? 'edit-turnaround' : 'turnaround'}>Turnaround Time</Label>
          <Input
            id={isEdit ? 'edit-turnaround' : 'turnaround'}
            value={formData.turnaround}
            onChange={(e) => setFormData({ ...formData, turnaround: e.target.value })}
            placeholder="e.g., 3-5 business days"
          />
        </div>
        <div>
          <Label htmlFor={isEdit ? 'edit-min-qty' : 'min-qty'}>Min Quantity</Label>
          <Input
            id={isEdit ? 'edit-min-qty' : 'min-qty'}
            type="number"
            value={formData.minQuantity}
            onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
          />
        </div>
      </div>

      {/* Pricing Type Selection */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <Label className="text-base font-semibold">Pricing Type</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="pricingType"
              value="static"
              checked={formData.pricingType === 'static'}
              onChange={() => setFormData({ ...formData, pricingType: 'static', options: [] })}
              className="w-4 h-4"
            />
            <span className="text-sm">Static Price</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="pricingType"
              value="dynamic"
              checked={formData.pricingType === 'dynamic'}
              onChange={() => setFormData({ ...formData, pricingType: 'dynamic' })}
              className="w-4 h-4"
            />
            <span className="text-sm">Dynamic Pricing (with options)</span>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          {formData.pricingType === 'static'
            ? 'Product has a fixed base price with no configurable options.'
            : 'Product price varies based on customer-selected options (e.g., paper type, quantity, finish).'}
        </p>
      </div>

      {/* Dynamic Pricing Options */}
      {formData.pricingType === 'dynamic' && (
        <div className="border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Product Options (Price Modifiers)</Label>
            <Button type="button" variant="outline" size="sm" onClick={addOption}>
              <PlusCircle className="h-4 w-4 mr-1" /> Add Option
            </Button>
          </div>

          {formData.options.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No options configured. Click "Add Option" to create pricing options like paper type, quantity tiers, or finishes.
            </p>
          )}

          {formData.options.map((option, optIndex) => (
            <div key={option.id || optIndex} className="border border-muted rounded-lg p-3 space-y-3 bg-muted/20">
              <div className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Option ID</Label>
                    <Input
                      value={option.id}
                      onChange={(e) => updateOption(optIndex, 'id', e.target.value)}
                      placeholder="e.g., paper"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Option Name</Label>
                    <Input
                      value={option.name}
                      onChange={(e) => updateOption(optIndex, 'name', e.target.value)}
                      placeholder="e.g., Paper Stock"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={option.type}
                      onValueChange={(value) => updateOption(optIndex, 'type', value)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select">Select</SelectItem>
                        <SelectItem value="radio">Radio</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optIndex)} className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Option Values */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Values</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => addOptionValue(optIndex)} className="h-6 text-xs">
                    + Add Value
                  </Button>
                </div>
                {option.options.map((val, valIndex) => (
                  <div key={valIndex} className="grid grid-cols-4 gap-2 items-center">
                    <Input
                      value={val.value}
                      onChange={(e) => updateOptionValue(optIndex, valIndex, 'value', e.target.value)}
                      placeholder="Value (e.g., 300gsm)"
                      className="h-7 text-xs"
                    />
                    <Input
                      value={val.label}
                      onChange={(e) => updateOptionValue(optIndex, valIndex, 'label', e.target.value)}
                      placeholder="Label (e.g., 300gsm Cardstock)"
                      className="h-7 text-xs"
                    />
                    <Input
                      type="number"
                      value={val.priceModifier}
                      onChange={(e) => updateOptionValue(optIndex, valIndex, 'priceModifier', parseFloat(e.target.value) || 0)}
                      placeholder="Price modifier (₦)"
                      className="h-7 text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOptionValue(optIndex, valIndex)}
                      className="h-7 w-7 text-destructive"
                      disabled={option.options.length <= 1}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
      </Button>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your products</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Product</DialogTitle>
            </DialogHeader>
            <ProductForm onSubmit={handleCreate} isPending={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductForm onSubmit={handleUpdate} isEdit isPending={updateMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Products Table */}
      <div className="bg-card border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products && products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category_name || '-'}</TableCell>
                  <TableCell>{formatPrice(product.base_price)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No products found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

