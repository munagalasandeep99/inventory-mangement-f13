
import React from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardIcon, InventoryIcon, AddItemIcon, SparklesIcon, ReportsIcon, CloseIcon } from './Icons';

const navItems = [
  { to: 'dashboard', icon: DashboardIcon, text: 'Dashboard' },
  { to: 'inventory', icon: InventoryIcon, text: 'Inventory' },
  { to: 'add-item', icon: AddItemIcon, text: 'Add Item' },
  { to: 'sales-report', icon: ReportsIcon, text: 'Sales Report' },
];

interface VerticalNavProps {
    isOpen: boolean;
    closeNav: () => void;
}

const VerticalNav: React.FC<VerticalNavProps> = ({ isOpen, closeNav }) => {
  const baseClasses = "flex items-center px-4 py-3 text-gray-200 hover:bg-secondary-light hover:text-white transition-colors duration-200 rounded-md mx-2 my-1";
  const activeClasses = "bg-primary text-white";

  const handleLinkClick = () => {
    if (isOpen) {
        closeNav();
    }
  };

  return (
    <nav className={`
        flex flex-col w-64 bg-secondary text-white shrink-0
        fixed md:relative inset-y-0 left-0 z-30
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
    `}>
      <div className="flex items-center justify-between h-20 border-b border-gray-700 px-4">
        <div className="flex items-center">
            <SparklesIcon className="h-7 w-7 text-primary" />
            <h1 className="ml-2 text-2xl font-bold text-white tracking-wider">InventoFlow</h1>
        </div>
        <button 
            onClick={closeNav} 
            className="md:hidden p-2 rounded-md text-gray-300 hover:bg-secondary-light"
            aria-label="Close navigation menu"
        >
            <CloseIcon className="h-6 w-6" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto mt-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={`/app/${item.to}`}
                onClick={handleLinkClick}
                className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : ''}`}
              >
                <item.icon className="h-6 w-6 mr-3" />
                <span>{item.text}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default VerticalNav;