'use client';

import { 
  ArrowPathIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilIcon,
  ShoppingBagIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Product {
  id: string;
  title: string;
  price: number;
  gtin: string;
  brand: string;
  category: string;
  status: 'active' | 'disapproved' | 'pending';
  issues: string[];
  lastUpdated: string;
}

export default function ProductFeedManager() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      title: 'Premium Wireless Headphones',
      price: 199.99,
      gtin: '123456789012',
      brand: 'AudioTech',
      category: 'Electronics > Audio > Headphones',
      status: 'active',
      issues: [],
      lastUpdated: '2024-03-15T10:30:00Z',
    },
    {
      id: '2',
      title: 'Ergonomic Office Chair',
      price: 299.99,
      gtin: '',
      brand: 'ComfortPlus',
      category: 'Furniture > Office > Chairs',
      status: 'disapproved',
      issues: ['Missing GTIN', 'Incomplete product description'],
      lastUpdated: '2024-03-14T15:45:00Z',
    },
    // Add more sample products
  ]);

  const [filter, setFilter] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      disapproved: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(filter.toLowerCase()) ||
    product.brand.toLowerCase().includes(filter.toLowerCase()) ||
    product.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Feed Management</CardTitle>
          <CardDescription>
            Manage and optimize your product feed for Google Merchant Center
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search products..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-64"
              />
              <Button variant="outline">
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Refresh Feed
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" disabled={selectedProducts.length === 0}>
                Bulk Edit
              </Button>
              <Button variant="destructive" disabled={selectedProducts.length === 0}>
                Delete Selected
              </Button>
            </div>
          </div>

          {/* Products Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(products.map(p => p.id));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts([...selectedProducts, product.id]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.title}</div>
                        <div className="text-sm text-gray-500">{product.brand}</div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell>
                      {product.issues.length > 0 ? (
                        <div className="text-red-600 flex items-center">
                          <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                          {product.issues.length} issues
                        </div>
                      ) : (
                        <div className="text-green-600 flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          No issues
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(product.lastUpdated).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Feed Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Feed Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {products.filter(p => p.status === 'active').length}
                </div>
                <div className="text-sm text-gray-500">Active Products</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-full">
                <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {products.filter(p => p.status === 'disapproved').length}
                </div>
                <div className="text-sm text-gray-500">Disapproved Products</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <ShoppingBagIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {products.filter(p => p.issues.length > 0).length}
                </div>
                <div className="text-sm text-gray-500">Products with Issues</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 