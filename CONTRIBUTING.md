# Contributors Guide

## General Guidelines

We love contributions and need them to ensure the textbook is a high-quality resource. 
To avoid duplication of effort and to ensure all discussion happens in the same place, 
always check the existing issues and pull requests to see if the problem has already been addressed. 
It is worth removing the `is:open` filter to search through closed / merged issues too.

- If you notice any spelling / grammar errors and want to fix them, then feel free to go ahead and make a pull request. 
- If you want to correct a scientific / mathematical / code error, make an issue first so we can discuss the changes.
- Please make one pull request (using separate branches) for each issue.

### If you want to contribute original content:

- Please open an issue explaining your proposed additions **before** beginning any writing. Here we can discuss where your contribution will fit in, as well as making sure it fits the style and format of the rest of the textbook. **If you do not do this, there is no guarantee your work will be merged**.
- Create a pull request while your chapter is in progress, this way we can review it in the process of writing instead of asking for large changes after you have already written it.
- Try to follow the formatting and tone of the existing notebooks to ensure everything renders correctly and the textbook is coherent. 

## How to Edit the Textbook

The textbook uses jupyter book to generate the site from jupyter notebooks. To edit the pages you will first need to install jupyter and Qiskit, you can use the links below to help you do this:

- [Install Qiskit](https://qiskit.org/documentation/install.html)
- [Install Jupyter](https://jupyter.org/install)

If you are unfamiliar with git, you can follow this guide to making contributions:

- [Github Desktop Tutorial](https://github.com/firstcontributions/first-contributions/blob/master/github-desktop-tutorial.md)

You will need to fork the textbook, make changes in your own branch, then submit a pull request which we will review before merging. You must use jupyter notebook to edit the pages. If you change any code, please re-run the notebook (you can do this using the ⏭  button at the top of the notebook editor) to update the cell outputs.

**Important:** The notebooks to edit are inside the `content` folder.

## Tags in Qiskit Textbook Notebooks

After writing your chapter, you must add a few tags to your cells (You can see the tags using `view > tags`).

- If you include the chapter's title in your notebook, move this to its own cell and add a `remove_cell` tag to avoid duplicate titles on the website. This is only for the title that will appear in the sidebar.
- If you intentionally raise an exception in a cell, add a `raises-exception` tag to that code cell so our checking script knows this is intentional.
- Any code cell that uses IBM hardware, or relies on the results from such a cell needs a `uses-hardware` tag to alert the user this cannot be run on the website through [thebelab](https://thebelab.readthedocs.io/en/latest/).
- When creating graphs, you can hide the code that generated your graph on the website using the `remove_input` tag. The code and graph will not be interactive, essentially embedding a static image. The pro is that this enables future editors to modify it.
- Finally, after adding these tags, go to `view > none` and save your notebook to stop the tags from showing automatically when a reader opens the notebook.

For a list of contributors, see the [.bib](https://github.com/qiskit-community/qiskit-textbook/blob/master/content/qiskit-textbook.bib) file.

## Translation Guidelines
First of all, thank you for showing your interest in translating (localizing) Qiskit Textbook! This helps make the textbook more accessible and available to our global community.
If you are interested in contributing to translations, please follow the instructions below. For detailed guidelines, please check [here](./i18n/Translation-Guidelines.pdf).
1. If you want to add a new language and become a translation lead, you can open a GitHub issue to start a discussion with the Qiskit community team and recruit translation project members. Please refer to the [criteria](#What-is-the-criteria-for-adding-a-new-language) below to receive official support from the administrators for new languages.
2. Open the [LOCALIZATION_CONTRIBUTORS](./i18n/LOCALIZATION_CONTRIBUTORS) file. Look for the language header that you'd like to contribute to and sign up under there. If you do not find the language, please add it by yourself.
3. Create a pull request (PR) to add your name to the list. Make sure to follow the template to open a Pull Request.
    - Each contributor has to create their own PR and sign the CLA (see #4 below).
    - If you have an open issue for a language request, add the issue link to the PR.
4. If you have not contributed to Qiskit before, you will be prompted to sign the Qiskit Contributors License Agreement (CLA) in your PR.
5. After you meet the criteria below, the administrator will make a new branch for the new language so that you can start translation.
    - The documents in the [`content` folder of `stable` branch](https://github.com/qiskit-community/qiskit-textbook/tree/stable/content) are the latest original English documents. Please translate the latest documents and save them in the [`i18n/locales/xx` folder](./i18n/locales/) of your language branch with the same directory structure. 
    - Please also translate `messages.yml` and `toc.yml` in the `_data/xx` folder.
6. When 80% of the translation is completed on your language branch, you can send a merge Pull Request to the master branch.

### What is the criteria for adding a new language?

We want to make sure that translated languages have enough community support to ensure quality and consistency. 
1. A minimum of three contributors is necessary for any new languages to be added and receive official support from the administrators of the localization project.
2. In addition to translators, we will need dedicated proof-readers to review the translations and approve accuracy of content in that language, to ensure the translations can be released in that language.
3. Among the group of contributors, a translation lead must be identified to serve as a liaison with the administrators of the localization project. The lead must contact Kifumi Numata (kifumi@jp.ibm.com) by email.

If you have further questions, please feel free to contact Kifumi Numata. Thank you.

### Contributing Guidelines to the [Japanese edition of Qiskit Textbook](https://qiskit.org/textbook/ja/preface.html)
 [日本語翻訳のガイドライン](./i18n/locales/ja/guideline-ja.md)

When new content is added to the original textbook, you can contribute to translating it to Japanese by:
- Find the corresponding original file under the [`content` folder of the `master` branch](https://github.com/qiskit-community/qiskit-textbook/tree/master/content).
- Translate it to Japanese.
- Add the translated file under the [`i18n/locales/ja` folder of the `master-ja` branch](https://github.com/qiskit-community/qiskit-textbook/tree/master-ja/i18n/locales/ja) by sending Pull resquest.
- For detailed guidelines, please check [here](./i18n/locales/ja/guideline-ja.md).
