Array.from(document.getElementsByClassName('project failing'))
        .map((element) => {
            return element.getElementsByTagName('a')[0].textContent;
        });