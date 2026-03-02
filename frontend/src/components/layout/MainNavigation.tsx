import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useApi';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import React from 'react';

// Group categories into logical sections for the mega menu
const categoryGroups = [
  {
    name: 'Business Essentials',
    slugs: ['business-cards', 'letterheads', 'envelopes', 'compliment-slips', 'presentation-folders', 'notepads'],
  },
  {
    name: 'Marketing Materials',
    slugs: ['flyers-handbills', 'marketing-brochures', 'postcards', 'posters', 'booklets-catalogs', 'calendars'],
  },
  {
    name: 'Signage & Displays',
    slugs: ['banners-large-format', 'roll-up-banners', 'foam-boards', 'acrylic-signs', 'car-branding', 'window-graphics'],
  },
  {
    name: 'Labels & Packaging',
    slugs: ['stickers-labels', 'product-labels', 'packaging-boxes', 'paper-bags', 'gift-boxes'],
  },
  {
    name: 'Events & Promo',
    slugs: ['invitations', 'event-tickets', 'certificates', 'menus', 'promotional-items', 't-shirt-printing'],
  },
];

interface ListItemProps extends React.ComponentPropsWithoutRef<'a'> {
  title: string;
  href: string;
}

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
  ({ className, title, href, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            ref={ref}
            to={href}
            className={cn(
              'block select-none rounded-md px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className
            )}
            {...props}
          >
            {title}
          </Link>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = 'ListItem';

export function MainNavigation() {
  const { data: categories } = useCategories();

  // Get categories that match the slugs in each group
  const getGroupCategories = (slugs: string[]) => {
    if (!categories) return [];
    return categories.filter((cat) => slugs.includes(cat.slug));
  };

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {/* Products Dropdown with Categories */}
        <NavigationMenuItem>
    
          <NavigationMenuContent>
            <div className="grid w-[600px] gap-3 p-4 md:w-[700px] md:grid-cols-3 lg:w-[800px]">
              {categoryGroups.map((group) => {
                const groupCategories = getGroupCategories(group.slugs);
                if (groupCategories.length === 0) return null;
                
                return (
                  <div key={group.name} className="space-y-2">
                    <h4 className="text-sm font-semibold text-primary px-3">{group.name}</h4>
                    <ul className="space-y-1">
                      {groupCategories.map((category) => (
                        <ListItem
                          key={category.id}
                          title={category.name}
                          href={`/products/${category.slug}`}
                        />
                      ))}
                    </ul>
                  </div>
                );
              })}
              {/* View All Products Link */}
              {/* <div className="col-span-full border-t pt-3 mt-2">
                <Link
                  to="/products"
                  className="flex items-center justify-center w-full py-2 text-sm font-medium text-primary hover:underline"
                >
                  View All Products →
                </Link>
              </div> */}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* About Link */}
        <NavigationMenuItem>
          <Link to="/about" className={cn(navigationMenuTriggerStyle(), 'bg-transparent')}>
            About
          </Link>
        </NavigationMenuItem>

        {/* Product Link */}
        <NavigationMenuItem>
          <Link to="/products" className={cn(navigationMenuTriggerStyle(), 'bg-transparent')}>
            Products
          </Link>
        </NavigationMenuItem>

        {/* Contact Link */}
        <NavigationMenuItem>
          <Link to="/contact" className={cn(navigationMenuTriggerStyle(), 'bg-transparent')}>
            Contact
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

