'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('tbl_news', [
      {
        news_number: 'NEWS001',
        news_name: 'Thovalai Flower Market Expansion',
        news_title: 'Huge shed coming up at Thovalai Flower Market',
        news_long_description: 'Kanniyakumari District Collector R. Alagumeena visited the flower market at Thovalai near here on Saturday and inspected the ongoing erection of the sprawling shed in the market at a cost of ₹2.12 crore. The new infrastructure will provide better facilities for flower traders and improve market conditions.',
        news_short_description: 'New shed construction at Thovalai Flower Market for ₹2.12 crore.',
        news_image1: '/uploads/news1.jpg',
        news_image2: '/uploads/news2.jpg',
        document: '/uploads/news_doc1.pdf',
        status: 'active',
        priority: 1,
        created_date: new Date(),
        created_by: 'admin',
        modified_date: new Date(),
        modified_by: 'admin'
      },
      {
        news_number: 'NEWS002',
        news_name: 'Jasmine Market Growth',
        news_title: 'Rising demand for jasmine flowers in Indian markets',
        news_long_description: 'Demand for fresh jasmine flowers has skyrocketed in 2023, due in part to the increasing size and frequency of public gatherings across India. More people gathered. More celebrations happened. And with that, came a higher demand for fresh jasmine flowers.',
        news_short_description: 'Increased demand for jasmine flowers in 2023.',
        news_image1: '/uploads/jasmine_market1.jpg',
        news_image2: '/uploads/jasmine_market2.jpg',
        document: null,
        status: 'active',
        priority: 2,
        created_date: new Date(),
        created_by: 'admin',
        modified_date: new Date(),
        modified_by: 'admin'
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('tbl_news', null, {});
  }
};