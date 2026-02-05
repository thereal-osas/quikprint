import { useState } from 'react';
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import type { ProductResponse } from '@/services/api';

interface FormData {
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  shortDescription: string;
  basePrice: string;
  turnaround: string;
  minQuantity: string;
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

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingProduct(null);
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
    setFormData({
      name: product.name,
      slug: product.slug,
      categoryId: product.category_id,
      description: product.description || '',
      shortDescription: '',
      basePrice: product.base_price.toString(),
      turnaround: '',
      minQuantity: '1',
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

