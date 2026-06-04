'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('services', [
      {
        name:        'Potong Rambut',
        description: 'Potong rambut profesional sesuai bentuk wajah.',
        price:       75000,
        duration:    60,
        category:    'Rambut',
        image:       'https://images.unsplash.com/photo-1560066984-138daaa6c0b4?w=500&q=80',
        created_at:  new Date(),
        updated_at:  new Date(),
      },
      {
        name:        'Creambath',
        description: 'Perawatan rambut menyeluruh dengan pijat relaksasi.',
        price:       120000,
        duration:    60,
        category:    'Rambut',
        image:       'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80',
        created_at:  new Date(),
        updated_at:  new Date(),
      },
      {
        name:        'Cat Rambut',
        description: 'Pewarnaan rambut premium tahan lama.',
        price:       350000,
        duration:    120,
        category:    'Rambut',
        image:       'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=500&q=80',
        created_at:  new Date(),
        updated_at:  new Date(),
      },
      {
        name:        'Hair Treatment',
        description: 'Treatment intensif untuk rambut sehat berkilau.',
        price:       200000,
        duration:    90,
        category:    'Rambut',
        image:       'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=500&q=80',
        created_at:  new Date(),
        updated_at:  new Date(),
      },
      {
        name:        'Facial Treatment',
        description: 'Perawatan wajah deep cleansing untuk kulit sehat.',
        price:       180000,
        duration:    90,
        category:    'Wajah',
        image:       'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&q=80',
        created_at:  new Date(),
        updated_at:  new Date(),
      },
      {
        name:        'Manicure & Pedicure',
        description: 'Perawatan kuku tangan dan kaki.',
        price:       120000,
        duration:    75,
        category:    'Kuku',
        image:       'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&q=80',
        created_at:  new Date(),
        updated_at:  new Date(),
      },
      {
        name:        'Eyelash Extension',
        description: 'Bulu mata ekstensi natural, tahan 3-4 minggu.',
        price:       220000,
        duration:    120,
        category:    'Mata',
        image:       'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=500&q=80',
        created_at:  new Date(),
        updated_at:  new Date(),
      },
    ])
  },

  async down (queryInterface, Sequelize) {
    //menghapus data
    await queryInterface.bulkDelete('services', null, {})
  }
};
