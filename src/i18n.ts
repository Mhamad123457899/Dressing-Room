import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "Admin Panel": "Admin Panel",
          "Logout": "Logout",
          "Admin Login": "Admin Login",
          "DRESS TO IMPRESS": "DRESS TO IMPRESS",
          "Your ultimate wardrobe management system. Organize your clothes, create collections for events, and always look your best.": "Your ultimate wardrobe management system. Organize your clothes, create collections for events, and always look your best.",
          "Available Sizes": "Available Sizes",
          "Weather": "Weather",
          "Color": "Color",
          "Rent Now": "Rent Now",
          "Rented": "Rented",
          "Admin Access": "Admin Access",
          "Enter admin password to manage the dressing room.": "Enter admin password to manage the dressing room.",
          "Invalid password.": "Invalid password.",
          "Login successful!": "Login successful!",
          "Login failed.": "Login failed.",
          "Cold": "Cold",
          "Hot": "Hot",
          "All Weather": "All Weather",
          "Black": "Black",
          "White": "White",
          "Olive": "Olive",
          "Navy": "Navy",
          "Floral": "Floral",
          "Brown": "Brown"
        }
      },
      ku: {
        translation: {
          "Admin Panel": "پەنێلی ئەدمین",
          "Logout": "چوونەدەرەوە",
          "Admin Login": "چوونەژوورەوەی ئەدمین",
          "DRESS TO IMPRESS": "جلوبەرگ بۆ سەرنجڕاکێشان",
          "Your ultimate wardrobe management system. Organize your clothes, create collections for events, and always look your best.": "سیستەمی کۆتایی بەڕێوەبردنی جلوبەرگەکەت. جلوبەرگەکانت ڕێکبخە، کۆمەڵە بۆ بۆنەکان دروست بکە، و هەمیشە بە باشترین شێوە دەربکەوە.",
          "Available Sizes": "قەبارە بەردەستەکان",
          "Weather": "کەش و هەوا",
          "Color": "ڕەنگ",
          "Rent Now": "ئێستا بە کرێ بگرە",
          "Rented": "بە کرێ گیراوە",
          "Admin Access": "دەستڕاگەیشتنی ئەدمین",
          "Enter admin password to manage the dressing room.": "وشەی نهێنی ئەدمین بنووسە بۆ بەڕێوەبردنی ژووری جلگۆڕین.",
          "Invalid password.": "وشەی نهێنی هەڵەیە.",
          "Login successful!": "چوونەژوورەوە سەرکەوتوو بوو!",
          "Login failed.": "چوونەژوورەوە سەرکەوتوو نەبوو.",
          "Cold": "سارد",
          "Hot": "گەرم",
          "All Weather": "هەموو وەرزێک",
          "Black": "ڕەش",
          "White": "سپی",
          "Olive": "زەیتونی",
          "Navy": "نیلی",
          "Floral": "گوڵدار",
          "Brown": "قاوەیی"
        }
      },
      fr: {
        translation: {
          "Admin Panel": "Panneau d'administration",
          "Logout": "Déconnexion",
          "Admin Login": "Connexion administrateur",
          "DRESS TO IMPRESS": "S'HABILLER POUR IMPRESSIONNER",
          "Your ultimate wardrobe management system. Organize your clothes, create collections for events, and always look your best.": "Votre système ultime de gestion de garde-robe. Organisez vos vêtements, créez des collections pour des événements et soyez toujours à votre meilleur.",
          "Available Sizes": "Tailles disponibles",
          "Weather": "Météo",
          "Color": "Couleur",
          "Rent Now": "Louer maintenant",
          "Rented": "Loué",
          "Admin Access": "Accès administrateur",
          "Enter admin password to manage the dressing room.": "Entrez le mot de passe administrateur pour gérer la cabine d'essayage.",
          "Invalid password.": "Mot de passe incorrect.",
          "Login successful!": "Connexion réussie !",
          "Login failed.": "Échec de la connexion.",
          "Cold": "Froid",
          "Hot": "Chaud",
          "All Weather": "Tout temps",
          "Black": "Noir",
          "White": "Blanc",
          "Olive": "Olive",
          "Navy": "Marine",
          "Floral": "Floral",
          "Brown": "Marron"
        }
      },
      ar: {
        translation: {
          "Admin Panel": "لوحة التحكم",
          "Logout": "تسجيل الخروج",
          "Admin Login": "تسجيل دخول المسؤول",
          "DRESS TO IMPRESS": "ارتدِ لتثير الإعجاب",
          "Your ultimate wardrobe management system. Organize your clothes, create collections for events, and always look your best.": "نظامك الأمثل لإدارة خزانة الملابس. نظم ملابسك، وأنشئ مجموعات للمناسبات، وابدُ دائمًا في أفضل حالاتك.",
          "Available Sizes": "المقاسات المتاحة",
          "Weather": "الطقس",
          "Color": "اللون",
          "Rent Now": "استأجر الآن",
          "Rented": "مؤجر",
          "Admin Access": "وصول المسؤول",
          "Enter admin password to manage the dressing room.": "أدخل كلمة مرور المسؤول لإدارة غرفة الملابس.",
          "Invalid password.": "كلمة المرور غير صحيحة.",
          "Login successful!": "تم تسجيل الدخول بنجاح!",
          "Login failed.": "فشل تسجيل الدخول.",
          "Cold": "بارد",
          "Hot": "حار",
          "All Weather": "جميع الأجواء",
          "Black": "أسود",
          "White": "أبيض",
          "Olive": "زيتوني",
          "Navy": "كحلي",
          "Floral": "مزهر",
          "Brown": "بني"
        }
      },
      uk: {
        translation: {
          "Admin Panel": "Панель адміністратора",
          "Logout": "Вийти",
          "Admin Login": "Вхід адміністратора",
          "DRESS TO IMPRESS": "ВБИРАЙСЯ, ЩОБ ВРАЖАТИ",
          "Your ultimate wardrobe management system. Organize your clothes, create collections for events, and always look your best.": "Ваша найкраща система керування гардеробом. Організовуйте свій одяг, створюйте колекції для подій і завжди виглядайте якнайкраще.",
          "Available Sizes": "Доступні розміри",
          "Weather": "Погода",
          "Color": "Колір",
          "Rent Now": "Орендувати зараз",
          "Rented": "Орендовано",
          "Admin Access": "Доступ адміністратора",
          "Enter admin password to manage the dressing room.": "Введіть пароль адміністратора для керування гардеробною.",
          "Invalid password.": "Невірний пароль.",
          "Login successful!": "Вхід успішний!",
          "Login failed.": "Помилка входу.",
          "Cold": "Холодно",
          "Hot": "Спекотно",
          "All Weather": "Будь-яка погода",
          "Black": "Чорний",
          "White": "Білий",
          "Olive": "Оливковий",
          "Navy": "Темно-синій",
          "Floral": "Квітковий",
          "Brown": "Коричневий"
        }
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
