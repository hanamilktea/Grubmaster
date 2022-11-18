/* 
    SETUP 
*/

// Express
const path = require('path');
const express = require('express'); 
const app = express(); 
PORT = 9097; 
app.use(express.static(path.join(__dirname, '/public'))); 
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// Database
const db = require('./database/db-connector'); 

// Handlebars
const { engine } = require('express-handlebars');  // Import express-handlebars
var exphbs = require('express-handlebars'); 
app.engine('.hbs', engine(
    {
        extname: ".hbs", 

    }
));  // Create an instance of the handlebars engine to process templates
app.set('view engine', '.hbs');                 // Tell express to use the handlebars engine whenever it encounters a *.hbs file

if (typeof Handlebars !== 'undefined') {
    Handlebars.registerHelper('afterBody', function(name, options) {
      $('body').append('AFTER BODY');
    });
}; 



/* 
    ROUTES
*/

// Home Page
app.get('/', function(req, res) {
    res.render('home');
}); 

// Restaurants ROUTES
app.get('/restaurants', function(req, res) {   // Display all Restaurants and the details
    // Declare query1
    let showRestaurantsQuery; 

    // If there is no query string, perform a basic SELECT
    if (req.query.restaurant_name === undefined) {
        showRestaurantsQuery = 'SELECT * from Restaurants;'
        // show restaurants using SQL query - makes data appear out of order 
        // showRestaurantsQuery = "SELECT restaurant_id, restaurant_name, restaurant_website, restaurant_email, Cities.city_name as city FROM Restaurants INNER JOIN Cities ON Restaurants.city_id = Cities.city_id;" 
    }

    // If there is a query sring, we assume this is a search, and return desired results
    else {
        showRestaurantsQuery = `SELECT * FROM Restaurants WHERE restaurant_name LIKE "${req.query.restaurant_name}%"`
    }

    // query2 would be same in both cases
    let showCitiesQuery = "SELECT * FROM Cities;"

    // Run 1st query
    db.pool.query(showRestaurantsQuery, function(error, rows, fields){

        // Save the restaurants
        let restaurants = rows;

        // Run 2nd query
        db.pool.query(showCitiesQuery, (error, rows, fields) => {
            // Save cities
            let cities = rows;

            // Construct an object for reference in the table -- USE Array.map 
            let citiesMap = {};
            cities.map(city => {
                city_id = parseInt(city.city_id, 10)
                citiesMap[city_id] = city["city_name"]; 
            })

            // Overwrite the Cities ID with the city name in the Restaurants object
            restaurants = restaurants.map(restaurant => {
                return Object.assign(restaurant, {city: citiesMap[restaurant.city_id]}); 
            })

            console.log({data: restaurants})
            return res.render('restaurants', {data: restaurants, cities: cities});
        })
    })
});

// Add a new restaurant to database using AJAX
app.post('/restaurants/add-restaurant-ajax', function(req, res) {
    // Capture incoming data and parse them back to JSON
    let data = req.body;
    console.log(data);

    // Capture NULL values
    let restaurant_website = data.restaurant_website; 
    if (restaurant_website.length === 0) { 
        restaurant_website = 'NULL'
    }; 

    let restaurant_email = data.restaurant_email; 
    if (restaurant_email.length === 0) { 
        restaurant_email = 'NULL'
    }; 

    // Create the query and run it on the database
    addRestaurantQuery = `INSERT INTO Restaurants (restaurant_name, restaurant_website, restaurant_email, city_id) VALUES ('${data.restaurant_name}', '${restaurant_website}', '${restaurant_email}', '${data.city}');`
    db.pool.query(addRestaurantQuery, function(error, rows, fields){
        // check if there was an error
        if (error) {
            console.log(error)
            res.sendStatus(400); 
        }
        else {
            query2 = 'SELECT restaurant_id, restaurant_name, restaurant_website, restaurant_email, Cities.city_name as city FROM Restaurants INNER JOIN Cities ON Restaurants.city_id = Cities.city_id;';
            db.pool.query(query2, function(error, rows, fields) {
                if (error) {
                    console.log(error); 
                    res.sendStatus(400);
                }
                else {
                    console.log(rows); 
                    res.send(rows)
                }
            })
        }
    })
}); 

// Add a new restaurant to db using HTML
// app.post('/restaurants/add-restaurant-form', function(req, res){
//     // Capture the incoming data and parse it back to a JS object
//     let data = req.body;
//     console.log(data)

//     // Capture NULL values
//     let restaurant_website = data['input-restaurant-website']; 
//     if (restaurant_website.length === 0 ) { 
//         restaurant_website = 'NULL';
//     }; 

//     let restaurant_email = data['input-restaurant-email']; 
//     if (restaurant_email.length === 0) { 
//         restaurant_email = 'NULL';
//     }; 

//     let restaurant_name = data['input-restaurant-name']; 
//     if (restaurant_name.length === 0 ) { 
//         return;
//     }; 

//     let restaurant_city = parseInt(data['input-restaurant-city']); 
//     if (isNaN(restaurant_city)) {
//         return; 
//     };

//     // Create the query and run it on the database
//     query1 =`INSERT INTO Restaurants (restaurant_name, restaurant_website, restaurant_email, city_id) VALUES ('${data['input-restaurant-name']}', '${restaurant_website}', '${restaurant_email}', '${data['input-restaurant-city']}');`;
//     db.pool.query(query1, function(error, rows, fields){

//         // Check to see if there was an error
//         if (error) {

//             // Log the error to the terminal so we know what went wrong, and send the visitor an HTTP response 400 indicating it was a bad request.
//             console.log(error)
//             res.sendStatus(400);
//         }

//         // If there was no error, we redirect back to our root route, which automatically runs the SELECT * FROM bsg_people and
//         // presents it on the screen
//         else
//         {
//             res.redirect('/restaurants');
//         }
//     })
// });

// Delete a Restaurant from the database
app.delete('/restaurants/delete-restaurant-ajax/', function(req, res, next) {
    let data = req.body; 
    console.log(data);
    let restaurantID = parseInt(data.restaurant_id)
    console.log(data);
    // let deleteRestaurantHasCuisinesQuery = `DELETE FROM Restaurant_has_cuisines WHERE restaurant_id = ?`;  
    let deleteRestaurantQuery = `DELETE FROM Restaurants WHERE restaurant_id = ?`; 

    // Run 1st query
    // db.pool.query(deleteRestaurantHasCuisinesQuery, [restaurantId], function(error, rows, fields) {
    //     if (error) {
    //         console.log(error); 
    //         res.sendStatus(400); 
    //     }
    //     else {
            // Run 2nd wuery
            db.pool.query(deleteRestaurantQuery, [restaurantID], function(error, rows, fields) {
                if (error) {
                    console.log(error);
                    res.sendStatus(400); 
                } else {
                    res.sendStatus(204); 
                }
            })
    //     }
    // })
}); 

// Update a restaurant's deta
app.put('/restaurants/put-restaurant-ajax', function(req, res, next) {
        let data = req.body; 
        console.log(data);
    
        let restaurantID = parseInt(data.restaurant_id); 
        let restaurantName = data.restaurant_name;
        let restaurantWebsite = data.restaurant_website; 
        let restaurantEmail = data.restaurant_email; 
        let restaurantCity = parseInt(data.city); 
    
        let queryUpdateRestName = `UPDATE Restaurants SET restaurant_name = ? WHERE Restaurants.restaurant_id = ?`; 
        let queryUpdateRestWebsite = `UPDATE Restaurants SET restaurant_website = ? WHERE Restaurants.restaurant_id = ?`; 
        let queryUpdateRestEmail = `UPDATE Restaurants SET restaurant_email = ? WHERE Restaurants.restaurant_id = ?`; 
        let queryUpdateRestCity = `UPDATE Restaurants SET city_id = ? WHERE Restaurants.restaurant_id = ?`;
        let selectCity = `SELECT * FROM Cities WHERE city_id = ?`; 
        
        // Run the 1st query
        db.pool.query(queryUpdateRestName, [restaurantName, restaurantID], function(error, rows, fields) {
            if (error) {
                console.log(error);
                res.sendStatus(400); 
            }
            else 
            { 
            db.pool.query(queryUpdateRestWebsite, [restaurantWebsite, restaurantID], function(error, rows, fields) {
                if (error) {
                    console.log(error); 
                    res.sendStatus(400);
                } else{ 
                    db.pool.query(queryUpdateRestEmail, [restaurantEmail, restaurantID], function(error, rows, fields) {
                        if (error) {
                            console.log(error);
                            res.sendStatus(400); 
                        }
                        else{
                            db.pool.query(queryUpdateRestCity, [restaurantCity, restaurantID], function(error, rows, fields){
                                if (error) {
                                    console.log(error); 
                                    res.sendStatus(400); 
                                } 
                                else {
                                    // run the second query
                                    db.pool.query(selectCity, [restaurantCity], function (error, rows, fields) {
                                        if (error) { 
                                            console.log(error); 
                                            res.sendStatus(400); 
                                        } else {
                                            res.send(rows); 
                                        }
                                    })
                                }
                            })
                        }
                    })
                } 
            })
            }
        }
    );
}); 


// CUISINES ROUTES
// Display all cities or search result
app.get('/cuisines', function(req, res) {   // Display all Cuisines and the details
    // Declare query1
    let showCuisinesQuery; 

    // If there is no query string, perform a basic SELECT
    if (req.query.cuisine_name === undefined) {
        showCuisinesQuery = 'SELECT * from Cuisines;'
    }
    // If there is a query sring, we assume this is a search, and return desired results
    else {
        showCuisinesQuery = `SELECT * FROM Cuisines WHERE cuisine_name LIKE "${req.query.cuisine_name}%"`
    };

    // Run 1st query
    db.pool.query(showCuisinesQuery, function(error, rows, fields){

        // Save the restaurants
        let cuisines = rows;

            console.log({data: cuisines})
            return res.render('cuisines', {data: cuisines});
        }
    )
}); 

// Add new Cuisine to db
app.post('/cuisines/add-cuisine-ajax', function(req, res) {
    // Capture incoming data and parse them back to JSON
    let data = req.body;
    console.log(data);

    // Create the query and run it on the database
    const addCuisineQuery = `INSERT INTO Cuisines (cuisine_name) VALUES ('${data.cuisine_name}');`;
    db.pool.query(addCuisineQuery, function(error, rows, fields){
        // check if there was an error
        if (error) {
            console.log(error)
            res.sendStatus(400); 
        }
        else {
            query2 = 'SELECT * FROM Cuisines';
            db.pool.query(query2, function(error, rows, fields) {
                if (error) {
                    console.log(error); 
                    res.sendStatus(400);
                }
                else {
                    console.log(rows); 
                    res.send(rows)
                }
            })
        }
    })
}); 

// Update a cuisine's data
app.put('/cuisines/put-cuisine-ajax', function(req, res, next) {
    let data = req.body; 
    console.log(data);

    let cuisineID = parseInt(data.cuisine_id); 
    let cuisineName = data.cuisine_name;

    let queryUpdateCuisine = `UPDATE Cuisines SET cuisine_name = ? WHERE Cuisines.cuisine_id = ?`; 
    let queryGetCuisine = `SELECT * FROM Cuisines WHERE Cuisines.cuisine_id = ?`;
    
    // Run the 1st query
    db.pool.query(queryGetCuisine, [cuisineID], function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(400); 
        }
        else {
            db.pool.query(queryUpdateCuisine, [cuisineName, cuisineID], function(error, rows, fields) {
                if (error) {
                    console.log(error); 
                } 
                else {
                    res.send(rows)
                }
            })
        }
    })
}); 

// CITIES ROUTES
// Display all cities or search result
app.get('/cities', function(req, res) {   // Display all Cities and the details
    // Declare query1
    let showCitiesQuery; 

    // If there is no query string, perform a basic SELECT
    if (req.query.city_name === undefined) {
        showCitiesQuery = 'SELECT * from Cities;'
    }
    // If there is a query sring, we assume this is a search, and return desired results
    else {
        showCitiesQuery = `SELECT * FROM Cities WHERE city_name LIKE "${req.query.city_name}%"`
    };

    // Run 1st query
    db.pool.query(showCitiesQuery, function(error, rows, fields){

        // Save the restaurants
        let cities = rows;

            console.log({data: cities})
            return res.render('cities', {data: cities});
        }
    )
}); 

// Add new City to db
app.post('/cities/add-city-ajax', function(req, res) {
    // Capture incoming data and parse them back to JSON
    let data = req.body;
    console.log(data);

    // Create the query and run it on the database
    addCityQuery = `INSERT INTO Cities (city_name) VALUES ('${data.city_name}');`;
    db.pool.query(addCityQuery, function(error, rows, fields){
        // check if there was an error
        if (error) {
            console.log(error)
            res.sendStatus(400); 
        }
        else {
            query2 = 'SELECT * FROM Cities';
            db.pool.query(query2, function(error, rows, fields) {
                if (error) {
                    console.log(error); 
                    res.sendStatus(400);
                }
                else {
                    console.log(rows); 
                    res.send(rows)
                }
            })
        }
    })
}); 

// Update a city's data
app.put('/cities/put-city-ajax', function(req, res, next) {
    let data = req.body; 
    console.log(data);

    let cityID = parseInt(data.city_id); 
    let cityName = data.city_name;

    let queryUpdateCity = `UPDATE Cities SET city_name = ? WHERE Cities.city_id = ?`; 
    let queryGetCities = `SELECT * FROM Cities WHERE Cities.city_id = ?`;
    
    // Run the 1st query
    db.pool.query(queryGetCities, [cityID], function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(400); 
        }
        else {
            db.pool.query(queryUpdateCity, [cityName, cityID], function(error, rows, fields) {
                if (error) {
                    console.log(error); 
                } 
                else {
                    res.send(rows)
                }
            })
        }
    })
}); 


// RESTAURANT-HAS-CUISINES ROUTES
app.get('/restaurant-has-cuisines', function(req, res) {   // Display all Restaurants' Cuisines and the details
    // Declare query1
    let showRestaurantCuisinesQuery; 
    let showSearchQuery; 
    showRestaurantsQuery = `SELECT * FROM Restaurants;`;
    showCuisinesQuery = `SELECT * FROM Cuisines;`;

    // If there is no query string, perform a basic SELECT
    if (req.query.rc_restaurantSearch === undefined && req.query.rc_cuisineSearch === undefined) {
        showRestaurantCuisinesQuery = `SELECT restaurant_cuisine_id, Restaurants.restaurant_name as restaurants, Cuisines.cuisine_name as cuisines FROM Restaurant_has_cuisines 
        INNER JOIN Restaurants on Restaurant_has_cuisines.restaurant_id = Restaurants.restaurant_id 
        INNER JOIN Cuisines on Restaurant_has_cuisines.cuisine_id = Cuisines.cuisine_id;`; 
    }
    // If there is a query string, we assume this is a search, and return desired results
    if (req.query.rc_restaurantSearch !== undefined) {
        showRestaurantCuisinesQuery = `SELECT restaurant_cuisine_id, Restaurants.restaurant_name as restaurants, Cuisines.cuisine_name as cuisines FROM Restaurant_has_cuisines 
        INNER JOIN Restaurants on Restaurant_has_cuisines.restaurant_id = Restaurants.restaurant_id 
        INNER JOIN Cuisines on Restaurant_has_cuisines.cuisine_id = Cuisines.cuisine_id
        WHERE Restaurants.restaurant_name LIKE "${req.query.rc_restaurantSearch}%";`; 
    } 
    // if (req.query.rc_cuisineSearch !== undefined && req.query.rc_restaurantSearch === undefined) {
    //     showRestaurantCuisinesQuery = `SELECT restaurant_cuisine_id, Restaurants.restaurant_name as restaurants, Cuisines.cuisine_name as cuisines FROM Restaurant_has_cuisines 
    //     INNER JOIN Restaurants on Restaurant_has_cuisines.restaurant_id = Restaurants.restaurant_id 
    //     INNER JOIN Cuisines on Restaurant_has_cuisines.cuisine_id = Cuisines.cuisine_id
    //     WHERE Cuisines.cuisine_name LIKE "${req.query.rc_cuisineSearch}%";`; 
    // }

    db.pool.query(showRestaurantCuisinesQuery, function(error, rows, fields){    // Execute the query

        let restaurantCuisines = rows;
        console.log(restaurantCuisines)

            console.log({data: restaurantCuisines})
            return res.render('restaurant-has-cuisines', {data: restaurantCuisines});
        }
    })
});

// USERS ROUTES

// REVIEWS ROUTES

/*
    LISTENER
*/
app.listen(PORT, function() {
    console.log('Express started on http://localhost: ' + PORT + '; Press Ctrl-C to terminate.')
})