'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('tbl_products', [
      {
        product_number: '0989733832',
        product_name: 'Jasmine Grandiflorum',
        product_long_description: 'Spanning cultures and continents, Jasminum grandiflorum weaves a fragrant legacy from Himalayan origins to its role in the Iberian Peninsula during the Islamic Golden Age. It holds deep cultural symbolism, adorning individuals and gracing global festivities, rituals, and ceremonies across time.',
        uom: 'kg',
        product_short_description: 'A beautiful and delicate bloom known for its graceful appearance and soft fragrance.',
        product_image1: '/uploads/jasmine1.jpg',
        product_image2: '/uploads/jasmine2.jpg',
        product_group: 'Flowers',
        status: 'active',
        priority: 1,
        created_date: new Date(),
        modified_date: new Date()
      },
      {
        product_number: '0989733833',
        product_name: 'Tuberose',
        product_long_description: 'A highly fragrant flower cherished for its sweet, intoxicating scent and elegant white petals.',
        uom: 'kg',
        product_short_description: 'Aromatic white flowers with intense fragrance.',
        product_image1: '/uploads/tuberose1.jpg',
        product_image2: '/uploads/tuberose2.jpg',
        product_group: 'Flowers',
        status: 'active',
        priority: 2,
        created_date: new Date(),
        modified_date: new Date()
      },
      {
        product_number: '0989733834',
        product_name: 'Davana',
        product_long_description: 'Aromatic herb known for its sweet, fruity fragrance and traditional use in perfumery and rituals.',
        uom: 'kg',
        product_short_description: 'Traditional aromatic herb with sweet fragrance.',
        product_image1: '/uploads/davana1.jpg',
        product_image2: '/uploads/davana2.jpg',
        product_group: 'Herbs',
        status: 'active',
        priority: 3,
        created_date: new Date(),
        modified_date: new Date()
      },
      {
        product_number: '0989733835',
        product_name: 'Sambac',
        product_long_description: 'Aromatic herb known for its sweet, fruity fragrance and traditional use in perfumery and rituals.',
        uom: 'kg',
        product_short_description: 'Premium quality sambac flowers.',
        product_image1: '/uploads/sambac1.jpg',
        product_image2: '/uploads/sambac2.jpg',
        product_group: 'Flowers',
        status: 'active',
        priority: 4,
        created_date: new Date(),
        modified_date: new Date()
      },
      {
        product_number: '0989733836',
        product_name: 'Lemongrass',
        product_long_description: 'Aromatic herb known for its sweet, fruity fragrance and traditional use in perfumery and rituals.',
        uom: 'kg',
        product_short_description: 'Fresh lemongrass with citrus aroma.',
        product_image1: '/uploads/lemongrass1.jpg',
        product_image2: '/uploads/lemongrass2.jpg',
        product_group: 'Herbs',
        status: 'active',
        priority: 5,
        created_date: new Date(),
        modified_date: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('tbl_products', null, {});
  }
};