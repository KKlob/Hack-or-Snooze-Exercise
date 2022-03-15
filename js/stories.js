"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDeleteBtn = false) {
  // console.debug("generateStoryMarkup", story);
  const hostName = story.getHostName();

  const showStar = Boolean(currentUser);
  return $(`
      <li id="${story.storyId}">
        ${showDeleteBtn ? getDeleteBtnHTML() : ""}
        ${showStar ? getStarHTML(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

// returns html for trash can if story was created by user
function getDeleteBtnHTML() {
  return `
    <span class="trash-can">
      <i class="fas fa-trash-alt"></i>
    </span>`;
}

// return html for star if story is favorited
function getStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `
    <span class="star">
      <i class="${starType} fa-star"></i>
    </span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

// when a trash can is clicked, chose the closest parent <li> tag (aka the story), grab the storyId from it, then remove the story from API/storyList and refresh the stories on the page
async function deleteStory(evt) {
  console.debug("deleteStory");

  const $closestLi = $(evt.target).closest('li');
  const storyId = $closestLi.attr('id');

  await storyList.removeStory(currentUser, storyId);

  await putUserStoriesOnPage();
}

$ownStories.on('click', '.trash-can', deleteStory);

// collects all info for the new story, calls for html markup and appends it to the allStoriesList section.
// pushes the new story to the API
// hides the new story form after submission and resets the inputs.
async function submitNewStory(evt) {
  console.debug('submitNewStory');
  evt.preventDefault();

  // grab all info from form
  const author = $('#author-input').val();
  const title = $('#title-input').val();
  const url = $('#url-input').val();
  const username = currentUser.username;
  const story = await storyList.addStory(currentUser, { author, title, url, username });

  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  $('#new-story-section').hide();
  $submitForm.trigger('reset');
}

$submitForm.on('submit', submitNewStory);

// Empty the favoritedStories html
// if there are favorited stories for the user, go through each one and append them to the page.
// if not, let the user know they have no favorites
function putFavoritesListOnPage() {
  console.debug('putFavoriesListOnPage');

  $favoritedStories.empty();

  if (currentUser.favorites.length === 0) {
    $favoritedStories.append("<h5>No favorites added!</h5>");
  }
  else {
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }

  $favoritedStories.show();
}

// Handles the favoriting/unfavoriting of stories
async function toggleStoryFavorite(evt) {
  console.debug("toggleStoryFavorite");

  const $target = $(evt.target);
  const $closestLi = $target.closest("li");
  const storyId = $closestLi.attr('id');
  const story = storyList.stories.find(s => s.storyId === storyId);

  if ($target.hasClass("fas")) {
    await currentUser.removeStoryFromFavorites(story);
    $target.closest('i').toggleClass("fas far");
  }
  else {
    await currentUser.addStoryToFavorites(story);
    $target.closest('i').toggleClass('fas far');
  }
}

$allStoriesList.on('click', '.star', toggleStoryFavorite);

// empties ownStories of html
// if user has stories created by them it will append each one to the page.
// if not, let the user know they have no created stories
function putUserStoriesOnPage() {
  console.debug("putUserStoriesOnPage");

  $ownStories.empty();

  if (currentUser.ownStories.length === 0) {
    $ownStories.append("<h5>No Stories added by user yet!</h5>");
  }
  else {
    for (let story of currentUser.ownStories) {
      let $story = generateStoryMarkup(story, true);
      $ownStories.append($story);
    }
  }
  $ownStories.show();
}