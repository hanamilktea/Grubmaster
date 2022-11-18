function showform(dowhat) {
    /*
    * four DIVS: browse (Read), Insert, Update, Delete
    */
    if (dowhat == 'insert'){
        document.getElementById('search-city').style.display = 'none';
        document.getElementById('browse-cities').style.display = 'block';
        document.getElementById('add-city').style.display = 'block';
        document.getElementById('update-city').style.display = 'none';
    }
    else if (dowhat == 'update'){
        document.getElementById('search-city').style.display = 'none';
        document.getElementById('browse-cities').style.display = 'block';
        document.getElementById('add-city').style.display = 'none';
        document.getElementById('update-city').style.display = 'block';
    }
    else if (dowhat == 'all'){
        document.getElementById('search-city').style.display = 'block';
        document.getElementById('browse-cities').style.display = 'block';
        document.getElementById('add-city').style.display = 'block';
        document.getElementById('update-city').style.display = 'none';
    }
    else if (dowhat == 'browse') { //by default display browse
        document.getElementById('search-city').style.display = 'block';
        document.getElementById('browse-cities').style.display = 'block';
        document.getElementById('add-city').style.display = 'none';
        document.getElementById('update-city').style.display = 'none';
    }
}
function searchCity() {showform('search'); }
function newCity() { showform('insert'); }
function updateCity() {showform('update'); }
function browseCities() { showform('browse'); }
function showAll() { showform('all'); }
