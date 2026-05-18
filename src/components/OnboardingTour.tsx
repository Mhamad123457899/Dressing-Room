import React, { useEffect } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslation } from 'react-i18next';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        stagePadding: 5,
        allowClose: true,
        overlayColor: '#000000',
        onDeselected: () => {
          onClose();
        },
        onDestroyed: () => {
          onClose();
        },
        steps: [
          {
            element: '#app-logo',
            popover: {
              title: t('Welcome!'),
              description: t('This is Şan Closet Studio, your ultimate professional wardrobe management system.'),
              side: "bottom",
              align: 'start'
            }
          },
          {
            element: '#nav-closet',
            popover: {
              title: t('The Closet'),
              description: t('Browse your complete inventory here. Filter by color, type, or weather conditions.'),
              side: "bottom",
              align: 'start'
            }
          },
          {
            element: '#nav-production',
            popover: {
              title: t('Production Panel'),
              description: t('Access project planning, actor coordination, and scene tracking for your TVC projects.'),
              side: "bottom",
              align: 'start'
            }
          },
          {
            element: '#nav-lang',
            popover: {
              title: t('Language & Theme'),
              description: t('Switch between Kurdish, Arabic, and English, or change the app color theme here.'),
              side: "bottom",
              align: 'end'
            }
          },
          {
            element: '#nav-profile',
            popover: {
              title: t('Account Settings'),
              description: t('Manage your company identity, name, and logo directly.'),
              side: "bottom",
              align: 'end'
            }
          },
          {
            element: '#nav-admin',
            popover: {
              title: t('Admin Tools'),
              description: t('Add new items, manage clients, and oversee all activities in your studio.'),
              side: "bottom",
              align: 'end'
            }
          },
          {
            element: '#nav-logout',
            popover: {
              title: t('Logout'),
              description: t('Safely exit your session from here.'),
              side: "bottom",
              align: 'end'
            }
          }
        ]
      });

      driverObj.drive();
    }
  }, [isOpen, onClose, t]);

  return null;
};
