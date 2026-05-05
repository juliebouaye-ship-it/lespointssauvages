const LPS_MODALS_HTML = `
    <!-- ── Modal commande ── -->
    <div class="modal-backdrop" id="order-modal" aria-hidden="true">
      <section
        class="legal-modal order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
      >
        <button type="button" class="modal-close" id="close-order-modal" aria-label="Fermer la commande">×</button>
        <h2 id="order-modal-title"><span class="order-title-word">Commander</span> <span id="order-live-total" class="order-live-total">—</span></h2>

        <div class="order-modal-body">
          <div class="order-modal-section">
            <div class="form-row" id="order-row-product">
              <label for="order-product">Produit <span class="required" aria-hidden="true">*</span></label>
              <select id="order-product" name="order-product">
                <option value="">Choisir</option>
                <option value="petit">Petit mot</option>
                <option value="grand">Grand mot</option>
                <option value="chat">Petit chat qui dort</option>
              </select>
            </div>

            <div class="order-inline-fields">
              <div class="form-row">
                <label for="order-format">Format <span class="required" aria-hidden="true">*</span></label>
                <div class="pill-toggle pill-toggle--compact pill-toggle--format" role="radiogroup" aria-label="Choisir le format">
                  <input class="pill-toggle-input" type="radio" name="order-format-pill" id="order-format-kit" value="kit" />
                  <label class="pill-toggle-label" for="order-format-kit">Kit DIY</label>
                  <input class="pill-toggle-input" type="radio" name="order-format-pill" id="order-format-fini" value="fini" />
                  <label class="pill-toggle-label" for="order-format-fini">Finie</label>
                </div>
                <select id="order-format" name="order-format" class="sr-only" aria-hidden="true" tabindex="-1">
                  <option value="">Choisir</option>
                  <option value="kit">Kit DIY (tout inclus)</option>
                  <option value="fini">Broderie finie (prête à encadrer)</option>
                </select>
              </div>
              <div class="form-row">
                <label for="order-qty">Quantité <span class="required" aria-hidden="true">*</span></label>
                <div class="qty-stepper qty-stepper--wide">
                  <button type="button" class="qty-step-btn" data-qty-step="-1" aria-label="Diminuer la quantité">-</button>
                  <input id="order-qty" name="order-qty" class="accessory-qty" type="number" min="1" value="1" />
                  <button type="button" class="qty-step-btn" data-qty-step="1" aria-label="Augmenter la quantité">+</button>
                </div>
              </div>
            </div>
          </div>

          <div id="order-fields-mot" class="order-modal-section order-fields-group" hidden>
            <p class="order-modal-kicker">Personnalisation</p>
            <p class="order-step-hint" id="order-mot-hint" hidden>Choisissez d’abord un format, puis indiquez votre phrase.</p>
            <div class="form-row" id="order-row-phrase" hidden>
              <label for="order-phrase" id="order-phrase-label">Phrase brodée <span class="required" aria-hidden="true">*</span></label>
              <select id="order-phrase" name="order-phrase">
                <option value="">Choisir</option>
              </select>
            </div>
          </div>

          <div id="order-fields-chat" class="order-modal-section order-fields-group" hidden>
            <p class="order-modal-kicker">Motif chat</p>
            <div class="form-row">
              <label for="order-fourrure">Fourrure <span class="required" aria-hidden="true">*</span></label>
              <select id="order-fourrure" name="order-fourrure">
                <option value="">Choisir</option>
                <option value="noir">Noir</option>
                <option value="blanc">Blanc</option>
                <option value="roux">Roux / ginger</option>
                <option value="gris">Gris</option>
                <option value="bleu_gris">Bleu-gris</option>
                <option value="bicolore">Bicolore (supplément)</option>
              </select>
              <p class="form-note" id="order-fur-note" hidden>
                Note : pour fourrure blanche ou gris clair, le tissu est actuellement orange (plus de choix à venir).
              </p>
            </div>
            <p class="order-step-hint" id="order-chat-hint-format" hidden>
              Choisissez un format pour les options payantes, le prénom et la photo.
            </p>

            <div id="order-chat-step-options" class="order-chat-options" hidden>
              <div class="form-row" id="order-row-bicolore-detail" hidden>
                <label for="order-bicolore-detail">Précisions sur le bicolore <span class="required" aria-hidden="true">*</span></label>
                <textarea id="order-bicolore-detail" rows="2" placeholder="Répartition des couleurs, zones, masque, etc."></textarea>
              </div>

              <div class="form-row order-pill-field">
                <div class="order-prenom-head">
                  <span class="order-pill-label" id="order-prenom-legend">Prénom sur le tambour</span>
                  <span class="order-pill-label order-prenom-label" id="order-prenom-inline-label" hidden>Prénom</span>
                </div>
                <div class="order-prenom-grid">
                  <div class="pill-toggle pill-toggle--compact" role="radiogroup" aria-labelledby="order-prenom-legend">
                    <input class="pill-toggle-input" type="radio" name="order-prenom-addon" id="order-prenom-addon-no" value="0" checked />
                    <label class="pill-toggle-label" for="order-prenom-addon-no">Non</label>
                    <input class="pill-toggle-input" type="radio" name="order-prenom-addon" id="order-prenom-addon-yes" value="1" />
                    <label class="pill-toggle-label" for="order-prenom-addon-yes">Oui<span class="label-hint" id="order-prenom-price-hint"> (+3 €)</span></label>
                  </div>
                  <div class="form-row order-prenom-inline" id="order-row-prenom" hidden aria-label="Prénom">
                    <input id="order-prenom" type="text" placeholder="Ex. Miso, Noisette…" autocomplete="off" />
                  </div>
                </div>
              </div>

              <div class="form-row">
                <label for="order-photo-link">Lien vers une photo du chat <span class="label-hint">(optionnel)</span></label>
                <input id="order-photo-link" type="url" placeholder="Instagram, Google Photos, lien public…" />
              </div>
            </div>
          </div>

          <div class="form-row order-modal-section" id="order-row-commentaire" hidden>
            <label for="order-commentaire">Commentaire libre <span class="label-hint">(optionnel)</span></label>
            <textarea id="order-commentaire" rows="1" placeholder="Précisions, ton, ce qui vous tient à cœur…"></textarea>
          </div>

          <div class="order-footer-panel" id="order-footer-panel" hidden>
            <div class="order-cart-actions">
              <button type="button" class="btn btn-outline" id="order-add-cart-btn">Ajouter au panier</button>
              <button type="button" class="btn btn-ghost" id="order-continue-btn" hidden>Continuer mes achats</button>
              <button type="button" class="btn btn-primary" id="order-go-checkout-btn" hidden>Voir mon panier</button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <aside class="cart-drawer" id="cart-drawer" aria-hidden="true">
      <div class="cart-drawer-header">
        <h2>Votre panier</h2>
        <button type="button" class="modal-close" id="close-cart-drawer" aria-label="Fermer le panier">×</button>
      </div>
      <div id="order-cart-list" class="order-cart-list"></div>
      <div class="promo-block">
        <label for="drawer-promo-code-input">Code promo</label>
        <div class="promo-inline">
          <input id="drawer-promo-code-input" type="text" placeholder="Votre code promo" />
          <button type="button" class="btn btn-outline" id="drawer-promo-apply-btn">Appliquer</button>
          <button type="button" class="btn btn-ghost" id="drawer-promo-clear-btn">Retirer</button>
        </div>
        <p class="form-note" id="drawer-promo-feedback"></p>
      </div>
      <p class="order-cart-subtotal"><strong>Sous-total : <span id="order-cart-subtotal">0,00 €</span></strong></p>
      <div class="order-cart-delivery" id="order-cart-delivery">
        <p class="order-cart-delivery-label">Mode de remise</p>
        <div class="pill-toggle pill-toggle--compact pill-toggle--fit" role="radiogroup" aria-label="Mode de remise panier">
          <input class="pill-toggle-input" type="radio" name="delivery-method" id="delivery-method-ship" value="ship" checked />
          <label class="pill-toggle-label" for="delivery-method-ship">Expédition</label>
          <input class="pill-toggle-input" type="radio" name="delivery-method" id="delivery-method-pickup" value="pickup" />
          <label class="pill-toggle-label" for="delivery-method-pickup">Retrait atelier</label>
        </div>
      </div>
      <p class="order-cart-shipping" id="order-cart-shipping"><strong>Livraison : à calculer</strong></p>
      <p class="order-cart-total"><strong>Total panier : <span id="order-cart-total">0,00 €</span></strong></p>
      <div class="order-cart-footer">
        <button type="button" class="btn btn-outline" id="order-cart-clear-btn">Vider le panier</button>
        <button type="button" class="btn btn-primary" id="drawer-checkout-btn">Passer au paiement</button>
      </div>
    </aside>
    <div class="cart-drawer-backdrop" id="cart-drawer-backdrop" aria-hidden="true"></div>

    <div class="modal-backdrop" id="checkout-modal" aria-hidden="true">
      <section class="legal-modal checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title">
        <button type="button" class="modal-close" id="close-checkout-modal" aria-label="Fermer le paiement">×</button>
        <h2 id="checkout-modal-title">Paiement</h2>
        <p class="helper">Finalisez votre commande en toute sécurité avec PayPal.</p>
        <p class="helper">Un reçu PayPal est envoyé automatiquement après paiement. Si vous ne le recevez pas sous 5 minutes, contactez-moi.</p>
        <div class="order-form" id="checkout-shipping-form">
          <div class="form-row" id="checkout-delivery-row">
            <span class="order-pill-label">Mode de remise <span class="required" aria-hidden="true">*</span></span>
            <div class="pill-toggle pill-toggle--compact pill-toggle--fit" role="radiogroup" aria-label="Mode de remise paiement">
              <input class="pill-toggle-input" type="radio" name="delivery-method-checkout" id="delivery-method-checkout-ship" value="ship" checked />
              <label class="pill-toggle-label" for="delivery-method-checkout-ship">Expédition</label>
              <input class="pill-toggle-input" type="radio" name="delivery-method-checkout" id="delivery-method-checkout-pickup" value="pickup" />
              <label class="pill-toggle-label" for="delivery-method-checkout-pickup">Retrait atelier (gratuit)</label>
            </div>
            <p class="form-note shipping-method-note" id="shipping-method-note" hidden>
              Retrait atelier : Les Sorinières, du lundi au vendredi, 17h-19h. Un email de confirmation est envoyé avec les détails.
            </p>
          </div>
          <div class="form-row">
            <label for="shipping-fullname">Nom complet <span class="required" aria-hidden="true">*</span></label>
            <input id="shipping-fullname" type="text" required placeholder="Prénom Nom" />
          </div>
          <div class="form-row">
            <label for="shipping-email">Email <span class="required" aria-hidden="true">*</span></label>
            <input id="shipping-email" type="email" required placeholder="vous@email.com" />
          </div>
          <div class="form-row">
            <label for="shipping-phone">Téléphone</label>
            <input id="shipping-phone" type="tel" placeholder="06..." />
          </div>
          <div class="form-row shipping-address-row">
            <label for="shipping-address1">Adresse <span class="required" aria-hidden="true">*</span></label>
            <input id="shipping-address1" type="text" required placeholder="Numéro et rue" />
          </div>
          <div class="form-row shipping-address-row">
            <label for="shipping-address2">Complément</label>
            <input id="shipping-address2" type="text" placeholder="Bâtiment, étage, etc." />
          </div>
          <div class="order-inline-fields shipping-address-row" id="shipping-inline-city">
            <div class="form-row">
              <label for="shipping-postal">Code postal <span class="required" aria-hidden="true">*</span></label>
              <input id="shipping-postal" type="text" required placeholder="44000" />
            </div>
            <div class="form-row">
              <label for="shipping-city">Ville <span class="required" aria-hidden="true">*</span></label>
              <input id="shipping-city" type="text" required placeholder="Nantes" />
            </div>
          </div>
          <div class="form-row">
            <label for="shipping-notes">Notes de livraison</label>
            <textarea id="shipping-notes" rows="1" placeholder="Digicode, horaires, consignes..."></textarea>
          </div>
        </div>
        <div class="order-pay-primary">
          <div class="order-summary" id="checkout-summary-box">
            <p><strong>Sous-total articles :</strong> <span id="checkout-summary-subtotal">0,00 €</span></p>
            <p><strong>Livraison :</strong> <span id="checkout-summary-shipping">0,00 €</span></p>
            <p><strong>Total :</strong> <span id="checkout-summary-total">0,00 €</span></p>
          </div>
          <div class="form-row">
            <label for="promo-code-input">Code promo</label>
            <div class="promo-inline">
              <input id="promo-code-input" type="text" placeholder="Votre code promo" />
              <button type="button" class="btn btn-outline" id="promo-apply-btn">Appliquer</button>
              <button type="button" class="btn btn-ghost" id="promo-clear-btn">Retirer</button>
            </div>
            <p class="form-note" id="promo-feedback"></p>
          </div>
          <div id="order-paypal-wrap" class="order-paypal-wrap" hidden>
            <p class="helper order-paypal-label">Payer avec PayPal</p>
            <div id="order-paypal-container" class="order-paypal-container"></div>
          </div>
          <p class="form-note" id="order-paypal-hint" role="status"></p>
          <p class="order-fallback-mail">
            <button type="button" class="btn-text-link" id="order-mailto-btn">
              Un souci avec PayPal ? Envoyer la commande par email
            </button>
          </p>
        </div>
      </section>
    </div>

    <div class="modal-backdrop" id="legal-modal" aria-hidden="true">
      <section
        class="legal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
      >
        <button type="button" class="modal-close" id="close-legal-modal" aria-label="Fermer les mentions légales">
          ×
        </button>
        <h2 id="legal-modal-title">Mentions légales & conditions générales de vente</h2>
        <div class="legal-content">
          <h3>Éditeur du site</h3>
          <p>
            Les Points Rebelles<br />
            Les Sorinières, France<br />
            SIRET : 84344037100030<br />
            Contact : <a href="mailto:lespointsrebelles@gmail.com" data-email>lespointsrebelles@gmail.com</a>
          </p>

          <h3>Activité</h3>
          <p>
            Vente de créations textiles brodées, kits DIY et offres d’abonnement, en séries artisanales ou personnalisées.
          </p>

          <h3>Prix et paiement</h3>
          <p>
            Les prix sont indiqués en euros. Le paiement est sécurisé avec PayPal. Les frais éventuels (expédition) sont précisés avant validation.
          </p>

          <h3>Commandes personnalisées</h3>
          <p>
            Toute demande personnalisée fait l’objet d’un échange préalable (contenu, format, tarif, délais). La validation de la commande intervient après confirmation du paiement.
          </p>

          <h3>Livraison</h3>
          <p>
            Les kits sont expédiés sous 48 h ouvrées. Les délais des broderies finies et personnalisées varient selon la complexité et sont communiqués avant confirmation.
          </p>

          <h3>Droit de rétractation</h3>
          <p>
            Conformément au Code de la consommation, les produits personnalisés ne bénéficient pas du droit de rétractation. Pour les produits non personnalisés, un droit de rétractation de 14 jours peut s’appliquer à compter de la réception.
          </p>

          <h3>Propriété intellectuelle</h3>
          <p>
            Les contenus, visuels, motifs et textes du site sont protégés. Toute reproduction ou utilisation sans autorisation préalable est interdite.
          </p>

          <h3>Données personnelles</h3>
          <p>
            Les informations transmises via le formulaire ou email sont utilisées uniquement pour répondre aux demandes et gérer les commandes. Vous pouvez demander l’accès, la correction ou la suppression de vos données par email.
            Pour le détail des traitements, voir aussi la <button type="button" class="legal-inline-link" id="legal-to-privacy">politique de confidentialité</button>.
          </p>
        </div>
      </section>
    </div>

    <div class="modal-backdrop" id="privacy-modal" aria-hidden="true">
      <section
        class="legal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
      >
        <button type="button" class="modal-close" id="close-privacy-modal" aria-label="Fermer la politique de confidentialité">
          ×
        </button>
        <h2 id="privacy-modal-title">Politique de confidentialité</h2>
        <div class="legal-content">
          <h3>Responsable du traitement</h3>
          <p>
            Les Points Rebelles — Les Sorinières, France — SIRET 84344037100030 —
            <a href="mailto:lespointsrebelles@gmail.com" data-email>lespointsrebelles@gmail.com</a>
          </p>
          <h3>Données collectées</h3>
          <p>
            Données saisies dans le formulaire de commande (produit, options, commentaires), adresse email lors d’un
            contact ou d’un paiement, et données techniques minimales (logs hébergeur / PayPal selon leurs propres
            politiques).
          </p>
          <h3>Finalités</h3>
          <p>
            Répondre aux demandes, préparer et livrer les commandes, assurer le suivi client, respecter les obligations
            légales (facturation, comptabilité si applicable).
          </p>
          <h3>Base légale</h3>
          <p>Exécution du contrat (commande), intérêt légitime (amélioration du service), consentement lorsque requis.</p>
          <h3>Durée de conservation</h3>
          <p>
            Les données liées aux commandes sont conservées le temps nécessaire à leur traitement puis durée légale en
            matière commerciale et comptable. Les demandes par email sont conservées le temps utile au suivi.
          </p>
          <h3>Destinataires</h3>
          <p>
            Hébergeur du site (Netlify), prestataire de paiement (PayPal). Aucune revente de données à des tiers
            commerciaux.
          </p>
          <h3>Vos droits</h3>
          <p>
            Accès, rectification, effacement, limitation, opposition lorsque le droit applicable le permet — contact
            par email ci-dessus. Réclamation auprès de la CNIL possible.
          </p>
          <h3>Cookies</h3>
          <p>
            Ce site vise à rester sobre : pas de bannière cookies intrusive. Des cookies techniques ou liés aux
            paiements peuvent être déposés par PayPal lors du parcours de paiement.
          </p>
        </div>
      </section>
    </div>

    <div class="modal-backdrop" id="box-modal" aria-hidden="true">
      <section class="legal-modal" role="dialog" aria-modal="true" aria-labelledby="box-modal-title">
        <button type="button" class="modal-close" id="close-box-modal" aria-label="Fermer">×</button>
        <h2 id="box-modal-title">La box — quelques infos</h2>
        <form id="box-form" class="order-form" novalidate>
          <div class="form-row">
            <div class="box-plan-grid">
              <input type="hidden" id="box-plan" name="box-plan" value="aboMensuel" />
              <div id="box-subscribe-panel">
                <span class="box-intent-label">Rythme d’envoi <span class="required" aria-hidden="true">*</span></span>
                <div class="pill-toggle pill-toggle--compact pill-toggle--fit" role="radiogroup" aria-label="Fréquence de la box">
                  <input class="pill-toggle-input" type="radio" name="box-cadence" id="box-cadence-monthly" value="monthly" checked />
                  <label class="pill-toggle-label" for="box-cadence-monthly">1 box / mois</label>
                  <input class="pill-toggle-input" type="radio" name="box-cadence" id="box-cadence-bimonthly" value="bimonthly" />
                  <label class="pill-toggle-label" for="box-cadence-bimonthly">1 box / 2 mois</label>
                </div>
                <p class="muted" id="box-subscribe-price-hint">
                  À chaque fois, <span id="box-subscribe-unit-price">19,50</span>&nbsp;€ par box — livraison comprise.
                </p>
              </div>
              <p class="helper" id="box-once-summary" hidden>
                <strong>Coffret trois mois</strong> : trois kits à ouvrir au fil des semaines, <strong>une livraison par mois</strong>,
              </p>
              <span class="box-intent-label">Pour qui ?</span>
              <div class="pill-toggle pill-toggle--compact pill-toggle--fit" role="radiogroup" aria-label="Pour soi ou à offrir">
                <input class="pill-toggle-input" type="radio" name="box-intent" id="box-intent-self" value="self" checked />
                <label class="pill-toggle-label" for="box-intent-self">Moi</label>
                <input class="pill-toggle-input" type="radio" name="box-intent" id="box-intent-gift" value="gift" />
                <label class="pill-toggle-label" for="box-intent-gift">Offrir</label>
              </div>
            </div>
          </div>
          <div class="form-row">
            <label for="box-buyer-email">Votre email <span class="required" aria-hidden="true">*</span></label>
            <input id="box-buyer-email" type="email" required placeholder="vous@email.com" />
          </div>
          <div class="form-row" id="box-row-recipient-name" hidden>
            <label for="box-recipient-name">Nom du destinataire <span class="required" aria-hidden="true">*</span></label>
            <input id="box-recipient-name" type="text" placeholder="Prénom Nom" />
          </div>
          <div class="form-row" id="box-row-recipient-email" hidden>
            <label for="box-recipient-email">Email du destinataire</label>
            <input id="box-recipient-email" type="email" placeholder="destinataire@email.com" />
          </div>
          <div class="form-row">
            <label for="box-shipping-fullname">Nom complet (livraison) <span class="required" aria-hidden="true">*</span></label>
            <input id="box-shipping-fullname" type="text" required placeholder="Prénom Nom" />
          </div>
          <div class="form-row">
            <label for="box-shipping-address1">Adresse (livraison) <span class="required" aria-hidden="true">*</span></label>
            <input id="box-shipping-address1" type="text" required placeholder="Numéro et rue" />
          </div>
          <div class="order-inline-fields">
            <div class="form-row">
              <label for="box-shipping-postal">Code postal <span class="required" aria-hidden="true">*</span></label>
              <input id="box-shipping-postal" type="text" required placeholder="44000" />
            </div>
            <div class="form-row">
              <label for="box-shipping-city">Ville <span class="required" aria-hidden="true">*</span></label>
              <input id="box-shipping-city" type="text" required placeholder="Nantes" />
            </div>
          </div>
          <div class="form-row">
            <label for="box-message">Message / notes <span class="label-hint">(optionnel)</span></label>
            <textarea id="box-message" rows="2" placeholder="Message cadeau, date souhaitée, infos utiles..."></textarea>
            <p class="form-note">Toute commande validée après le 15 du mois démarre le mois suivant.</p>
          </div>
          <div class="form-row">
            <label for="box-promo-code">Code promo <span class="label-hint">(optionnel)</span></label>
            <div class="promo-inline">
              <input id="box-promo-code" type="text" placeholder="Votre code promo" />
              <button type="button" class="btn btn-outline" id="box-promo-apply-btn">Appliquer</button>
              <button type="button" class="btn btn-ghost" id="box-promo-clear-btn">Retirer</button>
            </div>
            <p class="form-note" id="box-promo-feedback"></p>
          </div>
          <button type="submit" class="btn btn-primary">Continuer</button>
        </form>
        <div id="box-paypal-step" class="order-summary" hidden>
          <p><strong>Presque là</strong></p>
          <p id="box-paypal-step-intro" class="muted">Redirection vers PayPal pour confirmer l'abonnement — une minute, et c’est bouclé.</p>
          <p id="box-paypal-step-recap" class="muted"></p>
          <p class="muted">Après validation, la confirmation habituelle arrive par email.</p>
          <div class="order-cart-actions">
            <button type="button" class="btn btn-primary" id="box-paypal-continue-btn">Continuer vers PayPal</button>
            <button type="button" class="btn btn-ghost" id="box-paypal-back-btn">Modifier les infos</button>
          </div>
        </div>
      </section>
    </div>

    <div class="modal-backdrop" id="subscription-modal" aria-hidden="true">
      <section class="legal-modal" role="dialog" aria-modal="true" aria-labelledby="subscription-modal-title">
        <button type="button" class="modal-close" id="close-subscription-modal" aria-label="Fermer">×</button>
        <h2 id="subscription-modal-title">Gérer mon abonnement</h2>
        <form id="subscription-form" class="order-form" novalidate>
          <div class="form-row">
            <label for="subscription-type">Type de demande <span class="required" aria-hidden="true">*</span></label>
            <select id="subscription-type" required>
              <option value="cancel">Annuler mon abonnement</option>
              <option value="pause">Mettre en pause</option>
              <option value="info">Demande d'informations</option>
            </select>
          </div>
          <div class="form-row">
            <label for="subscription-email">Email <span class="required" aria-hidden="true">*</span></label>
            <input id="subscription-email" type="email" required placeholder="vous@email.com" />
          </div>
          <div class="form-row">
            <label for="subscription-message">Détails <span class="required" aria-hidden="true">*</span></label>
            <textarea id="subscription-message" rows="2" required placeholder="Ex: numéro d'abonnement, date de pause souhaitée, question..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Envoyer la demande</button>
        </form>
      </section>
    </div>

    <div class="modal-backdrop" id="custom-request-modal" aria-hidden="true">
      <section class="legal-modal" role="dialog" aria-modal="true" aria-labelledby="custom-request-modal-title">
        <button type="button" class="modal-close" id="close-custom-request-modal" aria-label="Fermer">×</button>
        <h2 id="custom-request-modal-title">Demander un motif personnalisé</h2>
        <p class="helper">Décrivez votre idée : je vous réponds rapidement avec faisabilité, délai et budget indicatif.</p>
        <form id="custom-request-form" class="order-form" novalidate>
          <div class="form-row">
            <label for="custom-request-name">Prénom</label>
            <input id="custom-request-name" type="text" placeholder="Votre prénom" />
          </div>
          <div class="form-row">
            <label for="custom-request-email">Email <span class="required" aria-hidden="true">*</span></label>
            <input id="custom-request-email" type="email" required placeholder="vous@email.com" />
          </div>
          <div class="form-row">
            <label for="custom-request-message">Votre idée <span class="required" aria-hidden="true">*</span></label>
            <textarea id="custom-request-message" rows="3" required placeholder="Thème, style, phrase, couleurs, format, référence..."></textarea>
          </div>
          <div class="form-row">
            <label for="custom-request-deadline">Échéance souhaitée <span class="label-hint">(optionnel)</span></label>
            <input id="custom-request-deadline" type="text" placeholder="Ex. avant le 15 juin" />
          </div>
          <button type="submit" class="btn btn-primary">Envoyer la demande</button>
        </form>
      </section>
    </div>

    <div class="modal-backdrop" id="gift-card-modal" aria-hidden="true">
      <section class="legal-modal gift-card-modal" role="dialog" aria-modal="true" aria-labelledby="gift-card-modal-title">
        <button type="button" class="modal-close" id="close-gift-card-modal" aria-label="Fermer la carte cadeau">×</button>
        <h2 id="gift-card-modal-title">Carte cadeau</h2>
        <p class="helper gift-card-modal-lead">Utilisable sur toute la boutique. Envoyé sous 24h par email après paiement.</p>
        <div class="order-form gift-card-modal-form">
          <div class="form-row">
            <label id="gift-amount-legend" for="gift-card-amount">Montant (€) <span class="required" aria-hidden="true">*</span></label>
            <div class="gift-card-presets" role="group" aria-labelledby="gift-amount-legend">
              <button type="button" class="gift-card-preset" data-gift-preset="5" aria-pressed="false">5</button>
              <button type="button" class="gift-card-preset" data-gift-preset="10" aria-pressed="false">10</button>
              <button type="button" class="gift-card-preset" data-gift-preset="30" aria-pressed="false">30</button>
              <button type="button" class="gift-card-preset" data-gift-preset="50" aria-pressed="false">50</button>
              <button type="button" class="gift-card-preset" data-gift-preset="100" aria-pressed="false">100</button>
            </div>
            <div class="gift-card-amount-wrap">
              <input id="gift-card-amount" class="gift-card-amount-input" type="number" min="1" step="0.01" inputmode="decimal" placeholder="ex. 25" aria-label="Montant en euros" />
              <span class="gift-card-amount-currency" aria-hidden="true">€</span>
            </div>
          </div>
          <div class="form-row">
            <label for="gift-recipient-prenom">Prénom (pour la personne concernée) <span class="required" aria-hidden="true">*</span></label>
            <input id="gift-recipient-prenom" type="text" placeholder="Ex. Camille" autocomplete="off" required />
          </div>
          <div class="form-row">
            <label for="gift-note">Précisions <span class="label-hint">(optionnel)</span></label>
            <textarea id="gift-note" class="gift-card-note" name="gift-note" rows="1" placeholder="Ex. remise pour Noël, ton du message, etc."></textarea>
          </div>
          <div class="form-row gift-card-submit-wrap">
            <button type="button" class="btn btn-primary btn-full" id="gift-card-submit-btn">Ajouter au panier</button>
          </div>
        </div>
      </section>
    </div>

    <div class="modal-backdrop" id="photo-gallery-modal" aria-hidden="true">
      <section class="legal-modal photo-gallery-modal" role="dialog" aria-modal="true" aria-labelledby="photo-gallery-title">
        <button type="button" class="modal-close" id="close-photo-gallery-modal" aria-label="Fermer la galerie">×</button>
        <h2 id="photo-gallery-title">Photos produit</h2>
        <div class="photo-gallery-body">
          <button type="button" class="photo-gallery-nav" id="photo-gallery-prev" aria-label="Photo précédente">‹</button>
          <figure class="photo-gallery-frame">
            <img id="photo-gallery-image" src="" alt="" />
            <figcaption id="photo-gallery-caption" class="photo-gallery-caption"></figcaption>
          </figure>
          <button type="button" class="photo-gallery-nav" id="photo-gallery-next" aria-label="Photo suivante">›</button>
        </div>
      </section>
    </div>
`;

document.body.insertAdjacentHTML("beforeend", LPS_MODALS_HTML);
